import { Router } from 'express';
import { sendResponse } from '../utils/sendResponse.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project Management SaaS API is healthy and operational',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: 'v1.0.0',
    },
  });
});

export default router;
