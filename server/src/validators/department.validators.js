import { body } from 'express-validator';

export const departmentValidator = [
  body('departmentName').trim().notEmpty().withMessage('Department name is required'),
  body('description').optional({ checkFalsy: true }).trim(),
];
