import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  await authService.registerUser(req.body);
  res.status(201).json(new ApiResponse('Registration successful'));
});

export const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.loginUser(req.body);
  res.status(200).json(new ApiResponse('Login successful', { token, user }));
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse('Logout successful'));
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  res.status(200).json(new ApiResponse('Current user fetched successfully', { user }));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changeUserPassword(req.user._id, currentPassword, newPassword);
  res.status(200).json(new ApiResponse('Password changed successfully'));
});
