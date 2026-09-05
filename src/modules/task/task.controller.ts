import { Request, Response } from 'express';
import { catchAsync } from '../../errors/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { httpStatus } from '../../constants/httpStatus.js';
import { taskService } from './task.service.js';
import { pick } from '../../utils/pick.js';

const createTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await taskService.createTask(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Task created successfully',
    data: result,
  });
});

const getAllTasks = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['search', 'projectId', 'sprintId', 'assigneeId', 'status', 'priority']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const { meta, data } = await taskService.getAllTasks(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tasks retrieved successfully',
    meta,
    data,
  });
});

const getTaskById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await taskService.getTaskById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Task details retrieved successfully',
    data: result,
  });
});

const updateTask = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await taskService.updateTask(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Task updated successfully',
    data: result,
  });
});

const updateTaskStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const { status } = req.body;
  const result = await taskService.updateTaskStatus(id, userId, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Task status updated and activity logged',
    data: result,
  });
});

const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await taskService.deleteTask(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Task deleted successfully',
    data: result,
  });
});

const addComment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const { content } = req.body;
  const result = await taskService.addComment(id, userId, content);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Comment added successfully',
    data: result,
  });
});

const addSubtask = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const { title } = req.body;
  const result = await taskService.addSubtask(id, userId, title);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subtask added successfully',
    data: result,
  });
});

const toggleSubtask = catchAsync(async (req: Request, res: Response) => {
  const subtaskId = req.params.subtaskId as string;
  const result = await taskService.toggleSubtask(subtaskId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subtask completion toggled successfully',
    data: result,
  });
});

export const taskController = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  addSubtask,
  toggleSubtask,
};
