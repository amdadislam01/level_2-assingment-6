import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { UserRole } from '@prisma/client';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { sprintValidation } from './sprint.validation.js';
import { sprintController } from './sprint.controller.js';

const router = Router();

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest(sprintValidation.createSprintSchema),
  sprintController.createSprint
);

router.get(
  '/project/:projectId',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  sprintController.getSprintsByProjectId
);

router.patch(
  '/:id/status',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest(sprintValidation.updateSprintStatusSchema),
  sprintController.updateSprintStatus
);

export const sprintRoutes = router;
