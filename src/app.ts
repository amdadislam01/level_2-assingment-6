import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { sendResponse } from './utils/sendResponse.js';

import { apiRateLimiter } from './middlewares/rateLimiter.js';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Rate Limiting
app.use('/api/v1', apiRateLimiter);

// Request Parsing & Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Welcome Root Route
app.get('/', (req, res) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Welcome to Project Management SaaS RESTful API',
    data: {
      documentation: 'See Postman Collection / API Docs',
      version: 'v1.0.0',
    },
  });
});

// API Version 1 Router
app.use('/api/v1', routes);

// Global 404 Handler
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
