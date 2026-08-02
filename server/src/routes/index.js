import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import departmentRoutes from './department.routes.js';
import categoryRoutes from './category.routes.js';
import complaintRoutes from './complaint.routes.js';
import officerRoutes from './officer.routes.js';
import adminRoutes from './admin.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/complaints', complaintRoutes);
router.use('/officer', officerRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

export default router;
