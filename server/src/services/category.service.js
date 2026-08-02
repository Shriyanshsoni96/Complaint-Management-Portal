import Category from '../models/Category.js';
import Department from '../models/Department.js';
import { ApiError } from '../utils/ApiError.js';

export async function listCategories(filters = {}) {
  const query = {};
  if (filters.department) {
    query.department = filters.department;
  }

  return Category.find(query).populate('department', 'departmentName').sort({ categoryName: 1 });
}

export async function createCategory({ categoryName, department }) {
  const departmentDoc = await Department.findById(department);
  if (!departmentDoc) {
    throw new ApiError(404, 'Department not found');
  }

  const existing = await Category.findOne({ categoryName, department });
  if (existing) {
    throw new ApiError(409, 'This category already exists for the selected department');
  }

  const category = await Category.create({ categoryName, department });
  return category.populate('department', 'departmentName');
}

export async function updateCategory(id, { categoryName, department }) {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  if (department && department !== category.department.toString()) {
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) {
      throw new ApiError(404, 'Department not found');
    }
    category.department = department;
  }

  if (categoryName) {
    category.categoryName = categoryName;
  }

  const duplicate = await Category.findOne({
    _id: { $ne: category._id },
    categoryName: category.categoryName,
    department: category.department,
  });
  if (duplicate) {
    throw new ApiError(409, 'This category already exists for the selected department');
  }

  await category.save();
  return category.populate('department', 'departmentName');
}

export async function deleteCategory(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  await category.deleteOne();
}
