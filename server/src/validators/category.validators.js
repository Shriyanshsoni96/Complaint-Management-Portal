import { body } from 'express-validator';

export const categoryValidator = [
  body('categoryName').trim().notEmpty().withMessage('Category name is required'),
  body('department').isMongoId().withMessage('A valid department id is required'),
];
