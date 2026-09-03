import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address format'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    role: z.nativeEnum(UserRole).optional().default(UserRole.MEMBER),
    organizationName: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address format'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty'),
  }),
});

export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ required_error: 'Refresh token cookie is required' }),
  }).optional(),
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
});

export const googleLoginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Google account email is required' }).email('Invalid email format'),
    name: z.string({ required_error: 'Name is required' }),
    googleId: z.string({ required_error: 'Google ID is required' }),
    avatarUrl: z.string().url().optional(),
  }),
});

export const authValidation = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  googleLoginSchema,
};
