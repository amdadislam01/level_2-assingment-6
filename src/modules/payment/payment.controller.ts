import { Request, Response } from 'express';
import { catchAsync } from '../../errors/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { httpStatus } from '../../constants/httpStatus.js';
import { paymentService } from './payment.service.js';
import { pick } from '../../utils/pick.js';
import { UserRole } from '@prisma/client';

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await paymentService.initiatePayment(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment session initiated successfully',
    data: result,
  });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { transactionId, status } = req.body;
  const result = await paymentService.verifyPayment(userId, transactionId, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.payment,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const result = await paymentService.handleWebhook(req.body, signature);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Webhook processed successfully',
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const role = req.user!.role as UserRole;

  const result = await paymentService.getPaymentById(id, userId, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment details retrieved successfully',
    data: result,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role as UserRole;
  const filters = pick(req.query, ['status', 'paymentMethod', 'plan', 'search']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const { meta, data } = await paymentService.getAllPayments(filters, options, userId, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payments list retrieved successfully',
    meta,
    data,
  });
});

const getPaymentStats = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getPaymentStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment and revenue statistics retrieved successfully',
    data: result,
  });
});

export const paymentController = {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  getPaymentById,
  getAllPayments,
  getPaymentStats,
};
