import { Router } from 'express';
import { sendResponse } from '../utils/sendResponse.js';
import { authRoutes } from '../modules/auth/auth.route.js';
import { userRoutes } from '../modules/user/user.route.js';

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

// Module Routers
const moduleRoutes = [
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/users',
    route: userRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
