import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    avatarUrl: z.string().url('Invalid URL format').optional(),
    oldPassword: z.string().optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
  }),
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(UserRole, { required_error: 'Role is required' }),
  }),
});

export const userValidation = {
  updateProfileSchema,
  updateUserRoleSchema,
};
