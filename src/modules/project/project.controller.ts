import { Request, Response } from 'express';
import { catchAsync } from '../../errors/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { httpStatus } from '../../constants/httpStatus.js';
import { projectService } from './project.service.js';
import { pick } from '../../utils/pick.js';

const createProject = catchAsync(async (req: Request, res: Response) => {
  const result = await projectService.createProject(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Project created successfully',
    data: result,
  });
});

const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['search', 'organizationId', 'status']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const { meta, data } = await projectService.getAllProjects(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Projects retrieved successfully',
    meta,
    data,
  });
});

const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await projectService.getProjectById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project details retrieved successfully',
    data: result,
  });
});

const updateProject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await projectService.updateProject(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project updated successfully',
    data: result,
  });
});

const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await projectService.deleteProject(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project deleted successfully',
    data: result,
  });
});

export const projectController = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
