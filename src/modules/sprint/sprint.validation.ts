import { z } from 'zod';
import { SprintStatus } from '@prisma/client';

const createSprintSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Sprint name is required' }).min(2, 'Name must be at least 2 characters'),
    goal: z.string().optional(),
    projectId: z.string({ required_error: 'Project ID is required' }),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string({ required_error: 'End date is required' }),
  }),
});

const updateSprintStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(SprintStatus, { required_error: 'Sprint status is required' }),
  }),
});

export const sprintValidation = {
  createSprintSchema,
  updateSprintStatusSchema,
};
