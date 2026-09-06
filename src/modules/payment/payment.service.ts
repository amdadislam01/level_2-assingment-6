import { PaymentMethod, PaymentStatus, SubscriptionPlan, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../errors/ApiError.js';
import { httpStatus } from '../../constants/httpStatus.js';
import { env } from '../../config/env.js';
import Stripe from 'stripe';

const stripe = new Stripe(env.stripe.secretKey || '', {
  apiVersion: '2024-11-20.acacia' as any,
});

interface IInitiatePaymentPayload {
  amount: number;
  plan: SubscriptionPlan;
  paymentMethod?: PaymentMethod;
  organizationId?: string;
  currency?: string;
}

const initiatePayment = async (userId: string, payload: IInitiatePaymentPayload) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orgMemberships: true,
      ownedOrganizations: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Determine organization
  let orgId = payload.organizationId;
  if (!orgId) {
    if (user.ownedOrganizations.length > 0) {
      orgId = user.ownedOrganizations[0].id;
    } else if (user.orgMemberships.length > 0) {
      orgId = user.orgMemberships[0].organizationId;
    }
  }

  if (!orgId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Organization ID is required to upgrade subscription plan'
    );
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Target organization not found');
  }

  // Generate unique transaction ID
  const transactionId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const paymentMethod = payload.paymentMethod || PaymentMethod.STRIPE;
  const currency = payload.currency || 'USD';

  let checkoutUrl = `https://checkout.stripe.com/pay/${transactionId}`;

  // Try creating Stripe session if secret key is valid
  if (paymentMethod === PaymentMethod.STRIPE && process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('mock')) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `${payload.plan} Plan Subscription`,
                description: `Upgrade ${organization.name} to ${payload.plan} Plan`,
              },
              unit_amount: Math.round(payload.amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `https://your-domain.com/payment/success?txn=${transactionId}`,
        cancel_url: `https://your-domain.com/payment/cancel?txn=${transactionId}`,
        metadata: {
          transactionId,
          userId,
          organizationId: orgId,
          plan: payload.plan,
        },
      });
      if (session.url) {
        checkoutUrl = session.url;
      }
    } catch (err: any) {
      // Fallback checkout URL for sandbox/testing
      checkoutUrl = `https://sandbox-gateway.com/pay?txn=${transactionId}&amount=${payload.amount}&currency=${currency}`;
    }
  } else if (paymentMethod === PaymentMethod.BKASH) {
    const bkashBaseUrl = env.bkash.url || 'https://tokenized.sandbox.bKash.com/v1.2.0-beta';
    checkoutUrl = `${bkashBaseUrl}/create?txn=${transactionId}&amount=${payload.amount}&appKey=${env.bkash.appKey}`;
  }

  // Record Payment transaction in database
  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        transactionId,
        amount: payload.amount,
        currency,
        paymentMethod,
        status: PaymentStatus.PENDING,
        userId,
        organizationId: orgId,
        plan: payload.plan,
        gatewayResponse: {
          checkoutUrl,
          initiatedAt: new Date().toISOString(),
          provider: paymentMethod,
        },
      },
    });

    // Log Activity
    await tx.activityLog.create({
      data: {
        action: 'PAYMENT_INITIATED',
        entityType: 'PAYMENT',
        entityId: createdPayment.id,
        userId,
        organizationId: orgId,
        details: {
          transactionId,
          amount: payload.amount,
          plan: payload.plan,
          paymentMethod,
        },
      },
    });

    return createdPayment;
  });

  return {
    paymentId: payment.id,
    transactionId: payment.transactionId,
    amount: payment.amount,
    currency: payment.currency,
    plan: payment.plan,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    checkoutUrl,
    organizationId: orgId,
    createdAt: payment.createdAt,
  };
};

const verifyPayment = async (userId: string, transactionId: string, customStatus?: PaymentStatus) => {
  const existingPayment = await prisma.payment.findUnique({
    where: { transactionId },
    include: { organization: true },
  });

  if (!existingPayment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record with given transaction ID not found');
  }

  if (existingPayment.status === PaymentStatus.COMPLETED) {
    return {
      message: 'Payment has already been verified and completed.',
      payment: existingPayment,
    };
  }

  const targetStatus = customStatus || PaymentStatus.COMPLETED;

  // Execute database transaction to verify payment and upgrade subscription atomically
  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: targetStatus,
        gatewayResponse: {
          verifiedAt: new Date().toISOString(),
          verifiedBy: userId,
          status: targetStatus,
        },
      },
    });

    if (targetStatus === PaymentStatus.COMPLETED && existingPayment.organizationId) {
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days subscription

      // Upsert Subscription
      const existingSub = await tx.subscription.findFirst({
        where: { organizationId: existingPayment.organizationId },
      });

      if (existingSub) {
        await tx.subscription.update({
          where: { id: existingSub.id },
          data: {
            plan: existingPayment.plan,
            startDate: now,
            endDate,
            isActive: true,
          },
        });
      } else {
        await tx.subscription.create({
          data: {
            organizationId: existingPayment.organizationId,
            plan: existingPayment.plan,
            startDate: now,
            endDate,
            isActive: true,
          },
        });
      }

      // Log Subscription Upgrade Activity
      await tx.activityLog.create({
        data: {
          action: 'SUBSCRIPTION_UPGRADED',
          entityType: 'SUBSCRIPTION',
          entityId: existingPayment.organizationId,
          userId,
          organizationId: existingPayment.organizationId,
          details: {
            plan: existingPayment.plan,
            transactionId,
            amount: existingPayment.amount,
          },
        },
      });
    }

    // Log Activity
    await tx.activityLog.create({
      data: {
        action: `PAYMENT_${targetStatus}`,
        entityType: 'PAYMENT',
        entityId: existingPayment.id,
        userId,
        organizationId: existingPayment.organizationId,
        details: {
          transactionId,
          status: targetStatus,
          amount: existingPayment.amount,
        },
      },
    });

    return updatedPayment;
  });

  return {
    message: `Payment transaction ${transactionId} marked as ${targetStatus}`,
    payment: result,
  };
};

const handleWebhook = async (payload: any, signature?: string) => {
  const transactionId = payload?.data?.transactionId || payload?.transactionId;
  const eventType = payload?.type || 'payment_intent.succeeded';

  if (!transactionId) {
    return { received: true, note: 'No transaction ID found in payload' };
  }

  const status = eventType.includes('succeeded') || payload?.status === 'SUCCESS'
    ? PaymentStatus.COMPLETED
    : PaymentStatus.FAILED;

  const existingPayment = await prisma.payment.findUnique({
    where: { transactionId },
  });

  if (!existingPayment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found for webhook event');
  }

  if (existingPayment.status === PaymentStatus.COMPLETED) {
    return { message: 'Webhook event already processed', paymentId: existingPayment.id };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: existingPayment.id },
      data: {
        status,
        gatewayResponse: payload,
      },
    });

    if (status === PaymentStatus.COMPLETED && existingPayment.organizationId) {
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const existingSub = await tx.subscription.findFirst({
        where: { organizationId: existingPayment.organizationId },
      });

      if (existingSub) {
        await tx.subscription.update({
          where: { id: existingSub.id },
          data: {
            plan: existingPayment.plan,
            startDate: now,
            endDate,
            isActive: true,
          },
        });
      } else {
        await tx.subscription.create({
          data: {
            organizationId: existingPayment.organizationId,
            plan: existingPayment.plan,
            startDate: now,
            endDate,
            isActive: true,
          },
        });
      }
    }

    return updatedPayment;
  });

  return { success: true, payment: updated };
};

const getPaymentById = async (id: string, userId: string, role: UserRole) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  if (role !== UserRole.ADMIN && payment.userId !== userId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Access Forbidden! You can only view your own payment details.'
    );
  }

  return payment;
};

const getAllPayments = async (
  filters: { status?: PaymentStatus; paymentMethod?: PaymentMethod; plan?: SubscriptionPlan; search?: string },
  options: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' },
  userId: string,
  userRole: UserRole
) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  const whereConditions: any = {};

  // Non-admins can only see their payments
  if (userRole !== UserRole.ADMIN) {
    whereConditions.userId = userId;
  }

  if (filters.status) {
    whereConditions.status = filters.status;
  }

  if (filters.paymentMethod) {
    whereConditions.paymentMethod = filters.paymentMethod;
  }

  if (filters.plan) {
    whereConditions.plan = filters.plan;
  }

  if (filters.search) {
    whereConditions.OR = [
      { transactionId: { contains: filters.search, mode: 'insensitive' } },
      { currency: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.payment.count({ where: whereConditions }),
    prisma.payment.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data,
  };
};

const getPaymentStats = async () => {
  const [totalRevenue, totalPayments, completedPayments, pendingPayments, planBreakdown] =
    await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.COMPLETED },
      }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: PaymentStatus.COMPLETED } }),
      prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      prisma.payment.groupBy({
        by: ['plan'],
        _count: { plan: true },
        _sum: { amount: true },
      }),
    ]);

  return {
    totalRevenue: totalRevenue._sum.amount || 0,
    totalTransactions: totalPayments,
    completedTransactions: completedPayments,
    pendingTransactions: pendingPayments,
    planBreakdown,
  };
};

export const paymentService = {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  getPaymentById,
  getAllPayments,
  getPaymentStats,
};
