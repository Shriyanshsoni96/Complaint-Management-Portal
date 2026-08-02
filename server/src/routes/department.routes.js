import { Router } from 'express';
import * as departmentController from '../controllers/department.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { mongoIdParam } from '../validators/common.validators.js';
import { departmentValidator } from '../validators/department.validators.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get('/', protect, departmentController.getDepartments);
router.post(
  '/',
  protect,
  authorize(ROLES.ADMIN),
  departmentValidator,
  validateRequest,
  departmentController.createDepartment,
);
router.put(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  mongoIdParam('id'),
  departmentValidator,
  validateRequest,
  departmentController.updateDepartment,
);
router.delete(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  mongoIdParam('id'),
  validateRequest,
  departmentController.deleteDepartment,
);

export default router;
