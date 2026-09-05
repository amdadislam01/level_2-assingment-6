import { Request, Response } from 'express';
import { catchAsync } from '../../errors/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { httpStatus } from '../../constants/httpStatus.js';
import { organizationService } from './organization.service.js';
import { pick } from '../../utils/pick.js';

const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await organizationService.createOrganization(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Organization created successfully',
    data: result,
  });
});

const getAllOrganizations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const filters = pick(req.query, ['search']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const { meta, data } = await organizationService.getAllOrganizations(filters, options, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Organizations retrieved successfully',
    meta,
    data,
  });
});

const getOrganizationById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await organizationService.getOrganizationById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Organization details retrieved successfully',
    data: result,
  });
});

const updateOrganization = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await organizationService.updateOrganization(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Organization updated successfully',
    data: result,
  });
});

const deleteOrganization = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await organizationService.deleteOrganization(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Organization deleted successfully',
    data: result,
  });
});

const addMember = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await organizationService.addMember(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Member added to organization successfully',
    data: result,
  });
});

export const organizationController = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  addMember,
};
