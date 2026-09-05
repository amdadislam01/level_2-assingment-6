import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { UserRole } from '@prisma/client';
import { activityLogController } from './activityLog.controller.js';

const router = Router();

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  activityLogController.getActivityLogs
);

export const activityLogRoutes = router;
