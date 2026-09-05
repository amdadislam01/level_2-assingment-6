import { Router } from 'express';
import { sendResponse } from '../utils/sendResponse.js';
import { authRoutes } from '../modules/auth/auth.route.js';
import { userRoutes } from '../modules/user/user.route.js';
import { organizationRoutes } from '../modules/organization/organization.route.js';
import { projectRoutes } from '../modules/project/project.route.js';
import { sprintRoutes } from '../modules/sprint/sprint.route.js';
import { taskRoutes } from '../modules/task/task.route.js';
import { activityLogRoutes } from '../modules/activityLog/activityLog.route.js';

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
  {
    path: '/organizations',
    route: organizationRoutes,
  },
  {
    path: '/projects',
    route: projectRoutes,
  },
  {
    path: '/sprints',
    route: sprintRoutes,
  },
  {
    path: '/tasks',
    route: taskRoutes,
  },
  {
    path: '/activity-logs',
    route: activityLogRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
