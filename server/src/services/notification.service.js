import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';
import { emitNotificationCreated } from '../sockets/index.js';

export async function createNotification({ user, complaint, title, message, type = 'info' }) {
  const notification = await Notification.create({ user, complaint, title, message, type });
  emitNotificationCreated(notification);
  return notification;
}

export async function notifyAdmins({ complaint, title, message, type = 'info' }) {
  const admins = await User.find({ role: ROLES.ADMIN, isActive: true }).select('_id');
  if (admins.length === 0) return;

  const notifications = await Notification.insertMany(
    admins.map((admin) => ({ user: admin._id, complaint, title, message, type })),
  );
  notifications.forEach(emitNotificationCreated);
}

export async function listNotifications(userId, query) {
  const { isRead, page = 1, limit = 20 } = query;

  const filter = { user: userId };
  if (isRead !== undefined) {
    filter.isRead = isRead === 'true';
  }

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.max(Number(limit) || 20, 1);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return { notifications, page: pageNum, limit: limitNum, total, unreadCount };
}

export async function markAsRead(id, userId) {
  const notification = await Notification.findOne({ _id: id, user: userId });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  notification.isRead = true;
  await notification.save();
  return notification;
}

export async function deleteNotification(id, userId) {
  const notification = await Notification.findOne({ _id: id, user: userId });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  await notification.deleteOne();
}
