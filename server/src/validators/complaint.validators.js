import { body, query } from 'express-validator';
import { PRIORITY_VALUES, COMPLAINT_STATUS_VALUES } from '../constants/complaint.js';

const SORT_VALUES = ['newest', 'oldest', 'priority', 'status'];

export const listComplaintsValidator = [
  query('status').optional().isIn(COMPLAINT_STATUS_VALUES).withMessage('Invalid status value'),
  query('priority').optional().isIn(PRIORITY_VALUES).withMessage('Invalid priority value'),
  query('department').optional().isMongoId().withMessage('A valid department id is required'),
  query('category').optional().isMongoId().withMessage('A valid category id is required'),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid date'),
  query('sort').optional().isIn(SORT_VALUES).withMessage('Invalid sort value'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

export const createComplaintValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isMongoId().withMessage('A valid category id is required'),
  body('department').isMongoId().withMessage('A valid department id is required'),
  body('priority').optional().isIn(PRIORITY_VALUES).withMessage('Invalid priority value'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
];

export const updateComplaintValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('category').optional().isMongoId().withMessage('A valid category id is required'),
  body('department').optional().isMongoId().withMessage('A valid department id is required'),
  body('priority').optional().isIn(PRIORITY_VALUES).withMessage('Invalid priority value'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
];
