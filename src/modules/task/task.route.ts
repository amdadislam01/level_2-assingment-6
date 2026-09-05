import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { UserRole } from '@prisma/client';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { taskValidation } from './task.validation.js';
import { taskController } from './task.controller.js';

const router = Router();

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  validateRequest(taskValidation.createTaskSchema),
  taskController.createTask
);

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  taskController.getAllTasks
);

router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  taskController.getTaskById
);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  validateRequest(taskValidation.updateTaskSchema),
  taskController.updateTask
);

router.patch(
  '/:id/status',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  validateRequest(taskValidation.updateTaskStatusSchema),
  taskController.updateTaskStatus
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  taskController.deleteTask
);

router.post(
  '/:id/comments',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  validateRequest(taskValidation.addCommentSchema),
  taskController.addComment
);

router.post(
  '/:id/subtasks',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  validateRequest(taskValidation.addSubtaskSchema),
  taskController.addSubtask
);

router.patch(
  '/subtasks/:subtaskId/toggle',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  taskController.toggleSubtask
);

export const taskRoutes = router;
