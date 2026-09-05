import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

const createProjectSchema = z.object({
  name: z.string({ required_error: 'Project name is required' }).min(2, 'Name must be at least 2 characters'),
  key: z.string({ required_error: 'Project key is required' }).min(2).max(10),
  description: z.string().optional(),
  organizationId: z.string({ required_error: 'Organization ID is required' }),
  teamId: z.string().optional(),
  managerId: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  managerId: z.string().optional(),
});

export const projectValidation = {
  createProjectSchema,
  updateProjectSchema,
};
