import { z } from 'zod';
import { UserRole } from '@prisma/client';

const createOrgSchema = z.object({
  name: z.string({ required_error: 'Organization name is required' }).min(2, 'Name must be at least 2 characters'),
  slug: z
    .string({ required_error: 'Organization slug is required' })
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'),
  logoUrl: z.string().url().optional(),
});

const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().url().optional(),
});

const addMemberSchema = z.object({
  userEmail: z.string({ required_error: 'User email is required' }).email('Invalid email address'),
  role: z.nativeEnum(UserRole).optional().default(UserRole.MEMBER),
});

export const organizationValidation = {
  createOrgSchema,
  updateOrgSchema,
  addMemberSchema,
};
