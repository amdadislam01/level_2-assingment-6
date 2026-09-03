import { Request, Response } from 'express';
import { catchAsync } from '../../errors/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { httpStatus } from '../../constants/httpStatus.js';
import { userService } from './user.service.js';

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await userService.getMe(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await userService.updateMe(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile updated successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = req.query.search as string;

  const { meta, data } = await userService.getAllUsers(page, limit, search);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    meta,
    data,
  });
});

export const userController = {
  getMe,
  updateMe,
  getAllUsers,
};
