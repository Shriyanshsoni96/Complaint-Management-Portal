import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { mongoIdParam } from '../validators/common.validators.js';
import { updateUserValidator, assignComplaintValidator } from '../validators/admin.validators.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get('/dashboard', adminController.getDashboard);

router.get('/users', adminController.getUsers);
router.put(
  '/users/:id',
  mongoIdParam('id'),
  updateUserValidator,
  validateRequest,
  adminController.updateUser,
);
router.delete('/users/:id', mongoIdParam('id'), validateRequest, adminController.deleteUser);

router.patch(
  '/complaints/:id/assign',
  mongoIdParam('id'),
  assignComplaintValidator,
  validateRequest,
  adminController.assignComplaint,
);

export default router;
