import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as notificationService from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { notifications, page, limit, total, unreadCount } =
    await notificationService.listNotifications(req.user._id, req.query);
  res.status(200).json(
    new ApiResponse('Notifications fetched successfully', {
      notifications,
      page,
      limit,
      total,
      unreadCount,
    }),
  );
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse('Notification marked as read', { notification }));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse('Notification deleted successfully'));
});
