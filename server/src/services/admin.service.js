import User from '../models/User.js';
import Department from '../models/Department.js';
import Complaint from '../models/Complaint.js';
import ComplaintTimeline from '../models/ComplaintTimeline.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';
import { COMPLAINT_STATUS, COMPLAINT_STATUS_VALUES } from '../constants/complaint.js';
import * as notificationService from './notification.service.js';
import { emitComplaintUpdated, emitDashboardUpdate } from '../sockets/index.js';

const COMPLAINT_POPULATE_FIELDS = [
  { path: 'category', select: 'categoryName' },
  { path: 'department', select: 'departmentName' },
  { path: 'createdBy', select: 'name email phone' },
  { path: 'assignedTo', select: 'name email' },
];

export async function listUsers(query) {
  const { role, department, search, page = 1, limit = 20 } = query;

  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.max(Number(limit) || 20, 1);

  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('department', 'departmentName')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  return { users, page: pageNum, limit: limitNum, total };
}

export async function updateUser(id, payload, actingAdminId) {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isSelf = id.toString() === actingAdminId.toString();
  const { name, phone, role, department, isActive } = payload;

  if (role) {
    if (isSelf && role !== ROLES.ADMIN) {
      throw new ApiError(400, 'You cannot change your own role');
    }

    if (role === ROLES.OFFICER) {
      const departmentId = department || user.department;
      if (!departmentId) {
        throw new ApiError(400, 'A department is required for officer accounts');
      }
      const departmentDoc = await Department.findById(departmentId);
      if (!departmentDoc) throw new ApiError(404, 'Department not found');
      user.department = departmentId;
    } else {
      user.department = null;
    }
    user.role = role;
  } else if (department) {
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) throw new ApiError(404, 'Department not found');
    user.department = department;
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (typeof isActive === 'boolean') {
    if (isSelf && isActive === false) {
      throw new ApiError(400, 'You cannot deactivate your own account');
    }
    user.isActive = isActive;
  }

  await user.save();
  return user;
}

export async function deleteUser(id, actingAdminId) {
  if (id.toString() === actingAdminId.toString()) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.isActive = false;
  await user.save();
}

export async function assignComplaint(complaintId, { officerId, departmentId }, actingAdminId) {
  const complaint = await Complaint.findOne({ _id: complaintId, isDeleted: false });
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }

  if ([COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED].includes(complaint.status)) {
    throw new ApiError(409, 'Cannot assign a complaint that is already resolved or closed');
  }

  const [officer, department] = await Promise.all([
    User.findById(officerId),
    Department.findById(departmentId),
  ]);

  if (!officer || officer.role !== ROLES.OFFICER) {
    throw new ApiError(404, 'Officer not found');
  }
  if (!officer.isActive) {
    throw new ApiError(400, 'Cannot assign a complaint to an inactive officer');
  }
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }
  if (!officer.department || officer.department.toString() !== departmentId) {
    throw new ApiError(400, 'The selected officer does not belong to this department');
  }

  const previousStatus = complaint.status;
  complaint.department = departmentId;
  complaint.assignedTo = officerId;
  complaint.status = COMPLAINT_STATUS.ASSIGNED;
  await complaint.save();

  await ComplaintTimeline.create({
    complaint: complaint._id,
    previousStatus,
    currentStatus: COMPLAINT_STATUS.ASSIGNED,
    updatedBy: actingAdminId,
    remarks: `Assigned to ${officer.name}`,
  });

  await Promise.all([
    notificationService.createNotification({
      user: complaint.createdBy,
      complaint: complaint._id,
      title: 'Complaint assigned',
      message: `Your complaint ${complaint.complaintId} has been assigned to an officer.`,
    }),
    notificationService.createNotification({
      user: officerId,
      complaint: complaint._id,
      title: 'New complaint assigned to you',
      message: `You have been assigned complaint ${complaint.complaintId}: ${complaint.title}`,
    }),
  ]);
  emitComplaintUpdated(complaint);
  emitDashboardUpdate();

  return complaint.populate(COMPLAINT_POPULATE_FIELDS);
}

function getMonthlyBuckets(count) {
  const now = new Date();
  const buckets = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return buckets;
}

async function getMonthlyTrends() {
  const months = getMonthlyBuckets(6);
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const raw = await Complaint.aggregate([
    { $match: { isDeleted: false, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const countByMonth = new Map(raw.map((entry) => [entry._id, entry.count]));
  return months.map((month) => ({ month, count: countByMonth.get(month) || 0 }));
}

export async function getDashboardStats() {
  const [
    totalComplaints,
    totalUsers,
    activeUsers,
    totalDepartments,
    statusCountsRaw,
    departmentPerformanceRaw,
    monthlyTrends,
  ] = await Promise.all([
    Complaint.countDocuments({ isDeleted: false }),
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    Department.countDocuments({}),
    Complaint.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [
                { $in: ['$status', [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED]] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department',
        },
      },
      { $unwind: '$department' },
      {
        $project: {
          _id: 0,
          departmentId: '$department._id',
          departmentName: '$department.departmentName',
          total: 1,
          resolved: 1,
        },
      },
    ]),
    getMonthlyTrends(),
  ]);

  const statusCounts = COMPLAINT_STATUS_VALUES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  statusCountsRaw.forEach((entry) => {
    statusCounts[entry._id] = entry.count;
  });

  return {
    totalComplaints,
    totalUsers,
    activeUsers,
    totalDepartments,
    statusCounts,
    departmentPerformance: departmentPerformanceRaw,
    monthlyTrends,
  };
}
