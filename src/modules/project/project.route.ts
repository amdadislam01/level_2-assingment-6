import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { UserRole } from '@prisma/client';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { projectValidation } from './project.validation.js';
import { projectController } from './project.controller.js';

const router = Router();

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest(projectValidation.createProjectSchema),
  projectController.createProject
);

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  projectController.getAllProjects
);

router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  projectController.getProjectById
);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest(projectValidation.updateProjectSchema),
  projectController.updateProject
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN),
  projectController.deleteProject
);

export const projectRoutes = router;
