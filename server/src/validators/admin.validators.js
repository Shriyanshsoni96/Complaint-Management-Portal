import { body } from 'express-validator';
import { ROLE_VALUES } from '../constants/roles.js';

export const updateUserValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('role').optional().isIn(ROLE_VALUES).withMessage('Invalid role value'),
  body('department').optional().isMongoId().withMessage('A valid department id is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const assignComplaintValidator = [
  body('officerId').isMongoId().withMessage('A valid officer id is required'),
  body('departmentId').isMongoId().withMessage('A valid department id is required'),
];
