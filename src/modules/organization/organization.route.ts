import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { UserRole } from '@prisma/client';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { organizationValidation } from './organization.validation.js';
import { organizationController } from './organization.controller.js';

const router = Router();

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest(organizationValidation.createOrgSchema),
  organizationController.createOrganization
);

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  organizationController.getAllOrganizations
);

router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  organizationController.getOrganizationById
);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest(organizationValidation.updateOrgSchema),
  organizationController.updateOrganization
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN),
  organizationController.deleteOrganization
);

router.post(
  '/:id/members',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  validateRequest(organizationValidation.addMemberSchema),
  organizationController.addMember
);

export const organizationRoutes = router;
