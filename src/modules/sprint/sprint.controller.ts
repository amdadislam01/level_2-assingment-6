import { Request, Response } from 'express';
import { catchAsync } from '../../errors/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { httpStatus } from '../../constants/httpStatus.js';
import { sprintService } from './sprint.service.js';

const createSprint = catchAsync(async (req: Request, res: Response) => {
  const result = await sprintService.createSprint(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Sprint created successfully',
    data: result,
  });
});

const getSprintsByProjectId = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const result = await sprintService.getSprintsByProjectId(projectId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project sprints retrieved successfully',
    data: result,
  });
});

const updateSprintStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const result = await sprintService.updateSprintStatus(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sprint status updated successfully',
    data: result,
  });
});

export const sprintController = {
  createSprint,
  getSprintsByProjectId,
  updateSprintStatus,
};
