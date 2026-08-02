import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} from '../validators/auth.validators.js';

const router = Router();

router.post('/register', registerValidator, validateRequest, authController.register);
router.post('/login', loginValidator, validateRequest, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch(
  '/change-password',
  protect,
  changePasswordValidator,
  validateRequest,
  authController.changePassword,
);

export default router;
