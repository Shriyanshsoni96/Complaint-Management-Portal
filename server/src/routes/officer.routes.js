import { Router } from 'express';
import * as officerController from '../controllers/officer.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { mongoIdParam } from '../validators/common.validators.js';
import {
  updateStatusValidator,
  addResolutionNoteValidator,
} from '../validators/officer.validators.js';
import { listComplaintsValidator } from '../validators/complaint.validators.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(protect, authorize(ROLES.OFFICER));

router.get(
  '/complaints',
  listComplaintsValidator,
  validateRequest,
  officerController.getAssignedComplaints,
);

router.patch(
  '/complaints/:id/status',
  mongoIdParam('id'),
  updateStatusValidator,
  validateRequest,
  officerController.updateComplaintStatus,
);

router.patch(
  '/complaints/:id/note',
  mongoIdParam('id'),
  addResolutionNoteValidator,
  validateRequest,
  officerController.addResolutionNote,
);

export default router;
