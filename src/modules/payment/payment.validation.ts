import { z } from 'zod';

const initiatePaymentZodSchema = z.object({
  body: z.object({
    amount: z.number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    }).positive('Amount must be greater than 0'),
    plan: z.enum(['FREE', 'PRO', 'ENTERPRISE'], {
      required_error: 'Subscription plan is required',
    }),
    paymentMethod: z.enum(['STRIPE', 'BKASH']).default('STRIPE'),
    organizationId: z.string().uuid('Invalid Organization ID format').optional(),
    currency: z.string().default('USD'),
  }),
});

const verifyPaymentZodSchema = z.object({
  body: z.object({
    transactionId: z.string({
      required_error: 'Transaction ID is required',
    }),
    status: z.enum(['COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  }),
});

export const paymentValidation = {
  initiatePaymentZodSchema,
  verifyPaymentZodSchema,
};
