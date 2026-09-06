import { Router } from 'express';
import { paymentController } from './payment.controller.js';
import { paymentValidation } from './payment.validation.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { auth } from '../../middlewares/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Public Webhook route for payment gateways
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.post(
  '/initiate',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  validateRequest(paymentValidation.initiatePaymentZodSchema),
  paymentController.initiatePayment
);

router.post(
  '/verify',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  validateRequest(paymentValidation.verifyPaymentZodSchema),
  paymentController.verifyPayment
);

router.get(
  '/stats/summary',
  auth(UserRole.ADMIN),
  paymentController.getPaymentStats
);

router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  paymentController.getPaymentById
);

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  paymentController.getAllPayments
);

export const paymentRoutes = router;
