import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as adminService from '../services/admin.service.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json(new ApiResponse('Dashboard stats fetched successfully', stats));
});

export const getUsers = asyncHandler(async (req, res) => {
  const { users, page, limit, total } = await adminService.listUsers(req.query);
  res.status(200).json(new ApiResponse('Users fetched successfully', { users, page, limit, total }));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse('User updated successfully', { user }));
});

export const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse('User deactivated successfully'));
});

export const assignComplaint = asyncHandler(async (req, res) => {
  const complaint = await adminService.assignComplaint(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse('Complaint assigned successfully', { complaint }));
});
