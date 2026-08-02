import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import ComplaintTimeline from '../models/ComplaintTimeline.js';
import Category from '../models/Category.js';
import Department from '../models/Department.js';
import { ApiError } from '../utils/ApiError.js';
import { generateComplaintId } from '../utils/generateComplaintId.js';
import { ROLES } from '../constants/roles.js';
import { COMPLAINT_STATUS, ALLOWED_STATUS_TRANSITIONS } from '../constants/complaint.js';
import * as notificationService from './notification.service.js';
import { emitComplaintUpdated, emitDashboardUpdate } from '../sockets/index.js';

const POPULATE_FIELDS = [
  { path: 'category', select: 'categoryName' },
  { path: 'department', select: 'departmentName' },
  { path: 'createdBy', select: 'name email phone' },
  { path: 'assignedTo', select: 'name email' },
];

async function generateUniqueComplaintId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateComplaintId();
    const existing = await Complaint.findOne({ complaintId: candidate });
    if (!existing) return candidate;
  }
  throw new ApiError(500, 'Failed to generate a unique complaint tracking ID');
}

// createdBy may be a raw ObjectId or, after `.populate()`, a full user object -
// always resolve to its id string before comparing.
function getIdString(value) {
  return (value?._id ?? value).toString();
}

function assertOwnerOrStaff(complaint, user) {
  const isOwner = getIdString(complaint.createdBy) === user._id.toString();
  const isStaff = user.role === ROLES.ADMIN || user.role === ROLES.OFFICER;
  if (!isOwner && !isStaff) {
    throw new ApiError(403, 'You do not have permission to access this complaint');
  }
}

export async function createComplaint(payload, files, user) {
  const { title, description, category, department, priority, address, city, state } = payload;

  const [categoryDoc, departmentDoc] = await Promise.all([
    Category.findById(category),
    Department.findById(department),
  ]);
  if (!categoryDoc) throw new ApiError(404, 'Category not found');
  if (!departmentDoc) throw new ApiError(404, 'Department not found');

  const complaintId = await generateUniqueComplaintId();
  const images = (files || []).map((file) => `/uploads/complaints/${file.filename}`);

  const complaint = await Complaint.create({
    complaintId,
    title,
    description,
    category,
    department,
    priority,
    address,
    city,
    state,
    images,
    createdBy: user._id,
  });

  await ComplaintTimeline.create({
    complaint: complaint._id,
    previousStatus: null,
    currentStatus: COMPLAINT_STATUS.PENDING,
    updatedBy: user._id,
    remarks: 'Complaint submitted',
  });

  await notificationService.notifyAdmins({
    complaint: complaint._id,
    title: 'New complaint submitted',
    message: `${complaint.complaintId}: ${complaint.title}`,
  });
  emitComplaintUpdated(complaint);
  emitDashboardUpdate();

  return complaint.populate(POPULATE_FIELDS);
}

function buildComplaintFilter(baseFilter, query) {
  const { status, department, category, priority, search, dateFrom, dateTo } = query;

  const filter = { ...baseFilter };
  if (status) filter.status = status;
  // Cast explicitly: unlike `.find()`, `.aggregate()`'s $match does not run
  // Mongoose's automatic string->ObjectId casting, so these must already be
  // ObjectId instances to match documents when the aggregation sort path is used.
  if (department) filter.department = new mongoose.Types.ObjectId(department);
  if (category) filter.category = new mongoose.Types.ObjectId(category);
  if (priority) filter.priority = priority;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { complaintId: { $regex: search, $options: 'i' } },
    ];
  }
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endOfDay;
    }
  }

  return filter;
}

// Priority/status are enums, not naturally sortable fields - rank them by
// severity/lifecycle order via aggregation rather than alphabetically.
const PRIORITY_RANK = { Low: 0, Medium: 1, High: 2, Emergency: 3 };
const STATUS_RANK = { Pending: 0, Assigned: 1, 'In Progress': 2, Resolved: 3, Closed: 4 };

const COMPLAINT_LOOKUP_STAGES = [
  {
    $lookup: {
      from: 'categories',
      localField: 'category',
      foreignField: '_id',
      as: 'category',
      pipeline: [{ $project: { categoryName: 1 } }],
    },
  },
  { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'departments',
      localField: 'department',
      foreignField: '_id',
      as: 'department',
      pipeline: [{ $project: { departmentName: 1 } }],
    },
  },
  { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'users',
      localField: 'createdBy',
      foreignField: '_id',
      as: 'createdBy',
      pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }],
    },
  },
  { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'users',
      localField: 'assignedTo',
      foreignField: '_id',
      as: 'assignedTo',
      pipeline: [{ $project: { name: 1, email: 1 } }],
    },
  },
  { $unwind: { path: '$assignedTo', preserveNullAndEmptyArrays: true } },
];

async function queryComplaintsByRank(filter, rankMap, rankField, sourceField, direction, pageNum, limitNum) {
  const branches = Object.entries(rankMap).map(([value, rank]) => ({
    case: { $eq: [sourceField, value] },
    then: rank,
  }));

  const [complaints, total] = await Promise.all([
    Complaint.aggregate([
      { $match: filter },
      { $addFields: { [rankField]: { $switch: { branches, default: 0 } } } },
      { $sort: { [rankField]: direction, createdAt: -1 } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
      ...COMPLAINT_LOOKUP_STAGES,
    ]),
    Complaint.countDocuments(filter),
  ]);

  return { complaints, page: pageNum, limit: limitNum, total };
}

async function queryComplaintsSorted(filter, { page = 1, limit = 10, sort }) {
  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.max(Number(limit) || 10, 1);

  if (sort === 'priority') {
    return queryComplaintsByRank(filter, PRIORITY_RANK, 'priorityRank', '$priority', -1, pageNum, limitNum);
  }
  if (sort === 'status') {
    return queryComplaintsByRank(filter, STATUS_RANK, 'statusRank', '$status', 1, pageNum, limitNum);
  }

  const sortOption = sort === 'oldest' ? 'createdAt' : '-createdAt';

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate(POPULATE_FIELDS)
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Complaint.countDocuments(filter),
  ]);

  return { complaints, page: pageNum, limit: limitNum, total };
}

export async function listComplaints(user, query) {
  const baseFilter = { isDeleted: false };
  if (user.role === ROLES.CITIZEN) {
    baseFilter.createdBy = user._id;
  }
  const filter = buildComplaintFilter(baseFilter, query);
  return queryComplaintsSorted(filter, query);
}

export async function listAssignedComplaints(officerId, query) {
  const filter = buildComplaintFilter({ isDeleted: false, assignedTo: officerId }, query);
  return queryComplaintsSorted(filter, query);
}

export async function getComplaintById(id, user) {
  const complaint = await Complaint.findOne({ _id: id, isDeleted: false }).populate(POPULATE_FIELDS);
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }
  assertOwnerOrStaff(complaint, user);
  return complaint;
}

export async function trackComplaint(complaintId, user) {
  const complaint = await Complaint.findOne({ complaintId, isDeleted: false }).populate(
    POPULATE_FIELDS,
  );
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }
  assertOwnerOrStaff(complaint, user);
  return complaint;
}

export async function getComplaintTimeline(id, user) {
  const complaint = await Complaint.findOne({ _id: id, isDeleted: false });
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }
  assertOwnerOrStaff(complaint, user);

  return ComplaintTimeline.find({ complaint: id })
    .populate('updatedBy', 'name role')
    .sort({ createdAt: 1 });
}

export async function updateComplaint(id, payload, user) {
  const complaint = await Complaint.findOne({ _id: id, isDeleted: false });
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }

  const isOwner = getIdString(complaint.createdBy) === user._id.toString();
  if (!isOwner) {
    throw new ApiError(403, 'You do not have permission to update this complaint');
  }
  if (complaint.status !== COMPLAINT_STATUS.PENDING || complaint.assignedTo) {
    throw new ApiError(409, 'This complaint can no longer be edited once it has been assigned');
  }

  const { title, description, category, department, priority, address, city, state } = payload;

  if (category) {
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) throw new ApiError(404, 'Category not found');
    complaint.category = category;
  }
  if (department) {
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) throw new ApiError(404, 'Department not found');
    complaint.department = department;
  }
  if (title) complaint.title = title;
  if (description) complaint.description = description;
  if (priority) complaint.priority = priority;
  if (address) complaint.address = address;
  if (city) complaint.city = city;
  if (state) complaint.state = state;

  await complaint.save();
  return complaint.populate(POPULATE_FIELDS);
}

export async function deleteComplaint(id, user) {
  const complaint = await Complaint.findOne({ _id: id, isDeleted: false });
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }

  const isOwner = getIdString(complaint.createdBy) === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isAdmin) {
    if (!isOwner) {
      throw new ApiError(403, 'You do not have permission to delete this complaint');
    }
    if (complaint.status !== COMPLAINT_STATUS.PENDING || complaint.assignedTo) {
      throw new ApiError(409, 'This complaint can no longer be deleted once it has been assigned');
    }
  }

  complaint.isDeleted = true;
  await complaint.save();
}

function assertAssignedToOfficer(complaint, officerId) {
  const assignedId = complaint.assignedTo ? getIdString(complaint.assignedTo) : null;
  if (assignedId !== officerId.toString()) {
    throw new ApiError(403, 'This complaint is not assigned to you');
  }
}

export async function updateComplaintStatus(id, officerId, { status, remarks }) {
  const complaint = await Complaint.findOne({ _id: id, isDeleted: false });
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }
  assertAssignedToOfficer(complaint, officerId);

  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[complaint.status] || [];
  if (!allowedNextStatuses.includes(status)) {
    throw new ApiError(409, `Cannot change status from "${complaint.status}" to "${status}"`);
  }

  const previousStatus = complaint.status;
  complaint.status = status;
  await complaint.save();

  await ComplaintTimeline.create({
    complaint: complaint._id,
    previousStatus,
    currentStatus: status,
    updatedBy: officerId,
    remarks: remarks || '',
  });

  const isResolution = [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED].includes(status);
  await notificationService.createNotification({
    user: complaint.createdBy,
    complaint: complaint._id,
    title: 'Complaint status updated',
    message: `Your complaint ${complaint.complaintId} status has been updated to ${status}.`,
    type: isResolution ? 'success' : 'info',
  });
  emitComplaintUpdated(complaint);
  emitDashboardUpdate();

  return complaint.populate(POPULATE_FIELDS);
}

export async function addResolutionNote(id, officerId, resolutionNote) {
  const complaint = await Complaint.findOne({ _id: id, isDeleted: false });
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }
  assertAssignedToOfficer(complaint, officerId);

  complaint.resolutionNote = resolutionNote;
  await complaint.save();
  return complaint.populate(POPULATE_FIELDS);
}
