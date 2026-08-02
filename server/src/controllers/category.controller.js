import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as categoryService from '../services/category.service.js';

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories({ department: req.query.department });
  res.status(200).json(new ApiResponse('Categories fetched successfully', { categories }));
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json(new ApiResponse('Category created successfully', { category }));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.status(200).json(new ApiResponse('Category updated successfully', { category }));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.status(200).json(new ApiResponse('Category deleted successfully'));
});
