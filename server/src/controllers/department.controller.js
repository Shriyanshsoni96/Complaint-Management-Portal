import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as departmentService from '../services/department.service.js';

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await departmentService.listDepartments();
  res.status(200).json(new ApiResponse('Departments fetched successfully', { departments }));
});

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.body);
  res.status(201).json(new ApiResponse('Department created successfully', { department }));
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment(req.params.id, req.body);
  res.status(200).json(new ApiResponse('Department updated successfully', { department }));
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  await departmentService.deleteDepartment(req.params.id);
  res.status(200).json(new ApiResponse('Department deleted successfully'));
});
