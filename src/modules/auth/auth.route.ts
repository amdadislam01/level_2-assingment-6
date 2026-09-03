import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { authValidation } from './auth.validation.js';
import { authController } from './auth.controller.js';

const router = Router();

router.post(
  '/register',
  validateRequest(authValidation.registerSchema),
  authController.register
);

router.post(
  '/login',
  validateRequest(authValidation.loginSchema),
  authController.login
);

router.post(
  '/refresh-token',
  authController.refreshToken
);

router.post(
  '/google',
  validateRequest(authValidation.googleLoginSchema),
  authController.googleLogin
);

export const authRoutes = router;
