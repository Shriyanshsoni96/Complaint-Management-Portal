import { body } from 'express-validator';
import { COMPLAINT_STATUS_VALUES } from '../constants/complaint.js';

export const updateStatusValidator = [
  body('status').isIn(COMPLAINT_STATUS_VALUES).withMessage('Invalid status value'),
  body('remarks').optional().trim(),
];

export const addResolutionNoteValidator = [
  body('resolutionNote').trim().notEmpty().withMessage('Resolution note is required'),
];
