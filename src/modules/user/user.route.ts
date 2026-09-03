import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { UserRole } from '@prisma/client';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { userValidation } from './user.validation.js';
import { userController } from './user.controller.js';

const router = Router();

// Protected profile routes (All 3 roles can access their own profile)
router.get(
  '/me',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  userController.getMe
);

router.patch(
  '/me',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  validateRequest(userValidation.updateProfileSchema),
  userController.updateMe
);

// Protected Admin/Manager route (Demonstrates 403 Forbidden for MEMBER role)
router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  userController.getAllUsers
);

export const userRoutes = router;
