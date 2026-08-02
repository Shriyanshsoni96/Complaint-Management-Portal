import { Router } from 'express';
import * as complaintController from '../controllers/complaint.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { handleComplaintImageUpload } from '../middlewares/upload.middleware.js';
import { mongoIdParam } from '../validators/common.validators.js';
import {
  createComplaintValidator,
  updateComplaintValidator,
  listComplaintsValidator,
} from '../validators/complaint.validators.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.post(
  '/',
  protect,
  authorize(ROLES.CITIZEN),
  handleComplaintImageUpload,
  createComplaintValidator,
  validateRequest,
  complaintController.createComplaint,
);

router.get(
  '/',
  protect,
  listComplaintsValidator,
  validateRequest,
  complaintController.getComplaints,
);

router.get('/track/:complaintId', protect, complaintController.trackComplaint);

router.get(
  '/:id/timeline',
  protect,
  mongoIdParam('id'),
  validateRequest,
  complaintController.getComplaintTimeline,
);

router.get(
  '/:id',
  protect,
  mongoIdParam('id'),
  validateRequest,
  complaintController.getComplaintById,
);

router.put(
  '/:id',
  protect,
  mongoIdParam('id'),
  updateComplaintValidator,
  validateRequest,
  complaintController.updateComplaint,
);

router.delete(
  '/:id',
  protect,
  mongoIdParam('id'),
  validateRequest,
  complaintController.deleteComplaint,
);

export default router;
