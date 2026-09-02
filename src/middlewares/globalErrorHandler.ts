import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../errors/ApiError.js';
import { env } from '../config/env.js';

export interface ErrorSource {
  path: string | number;
  message: string;
}

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Something went wrong';
  let errorSources: ErrorSource[] = [];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorSources = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate field value entered';
      const target = (err.meta?.target as string[]) || [];
      errorSources = [
        {
          path: target.join('.'),
          message: `${target.join(', ')} already exists`,
        },
      ];
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = (err.meta?.cause as string) || 'Record not found';
      errorSources = [{ path: '', message }];
    } else {
      statusCode = 400;
      message = err.message;
      errorSources = [{ path: '', message: err.message }];
    }
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: '', message: err.message }];
  } else if (err?.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorSources = [{ path: 'authorization', message }];
  } else if (err?.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    errorSources = [{ path: 'authorization', message }];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: '', message: err.message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errorSources,
    ...(env.nodeEnv === 'development' && { stack: err?.stack }),
  });
};
