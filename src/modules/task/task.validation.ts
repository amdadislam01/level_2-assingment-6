import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

const createTaskSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Task title is required' }).min(2, 'Title must be at least 2 characters'),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
    status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
    dueDate: z.string().optional(),
    projectId: z.string({ required_error: 'Project ID is required' }),
    sprintId: z.string().optional(),
    assigneeId: z.string().optional(),
  }),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.string().optional(),
    sprintId: z.string().optional(),
    assigneeId: z.string().optional(),
  }),
});

const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(TaskStatus, { required_error: 'Task status is required' }),
  }),
});

const addCommentSchema = z.object({
  body: z.object({
    content: z.string({ required_error: 'Comment content is required' }).min(1, 'Comment cannot be empty'),
  }),
});

const addSubtaskSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Subtask title is required' }).min(1, 'Title cannot be empty'),
  }),
});

export const taskValidation = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  addCommentSchema,
  addSubtaskSchema,
};
