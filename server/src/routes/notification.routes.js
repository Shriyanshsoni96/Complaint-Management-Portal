import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { mongoIdParam } from '../validators/common.validators.js';

const router = Router();

router.use(protect);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', mongoIdParam('id'), validateRequest, notificationController.markAsRead);
router.delete('/:id', mongoIdParam('id'), validateRequest, notificationController.deleteNotification);

export default router;
