import { Request, Response } from 'express';
import { catchAsync } from '../../errors/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { httpStatus } from '../../constants/httpStatus.js';
import { activityLogService } from './activityLog.service.js';
import { pick } from '../../utils/pick.js';

const getActivityLogs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['organizationId', 'taskId', 'userId']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const { meta, data } = await activityLogService.getActivityLogs(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Audit activity logs retrieved successfully',
    meta,
    data,
  });
});

export const activityLogController = {
  getActivityLogs,
};
