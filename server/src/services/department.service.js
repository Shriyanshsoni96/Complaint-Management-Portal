import Department from '../models/Department.js';
import Category from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';

export async function listDepartments() {
  return Department.find().sort({ departmentName: 1 });
}

export async function createDepartment({ departmentName, description }) {
  const existing = await Department.findOne({ departmentName });
  if (existing) {
    throw new ApiError(409, 'A department with this name already exists');
  }

  return Department.create({ departmentName, description });
}

export async function updateDepartment(id, { departmentName, description }) {
  const department = await Department.findById(id);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  if (departmentName && departmentName !== department.departmentName) {
    const existing = await Department.findOne({ departmentName });
    if (existing) {
      throw new ApiError(409, 'A department with this name already exists');
    }
    department.departmentName = departmentName;
  }

  if (description !== undefined) {
    department.description = description;
  }

  await department.save();
  return department;
}

export async function deleteDepartment(id) {
  const department = await Department.findById(id);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  const categoryCount = await Category.countDocuments({ department: id });
  if (categoryCount > 0) {
    throw new ApiError(409, 'Cannot delete a department that still has categories assigned to it');
  }

  await department.deleteOne();
}
