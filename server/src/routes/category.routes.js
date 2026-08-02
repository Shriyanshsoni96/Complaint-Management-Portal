import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { mongoIdParam } from '../validators/common.validators.js';
import { categoryValidator } from '../validators/category.validators.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get('/', protect, categoryController.getCategories);
router.post(
  '/',
  protect,
  authorize(ROLES.ADMIN),
  categoryValidator,
  validateRequest,
  categoryController.createCategory,
);
router.put(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  mongoIdParam('id'),
  categoryValidator,
  validateRequest,
  categoryController.updateCategory,
);
router.delete(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  mongoIdParam('id'),
  validateRequest,
  categoryController.deleteCategory,
);

export default router;
