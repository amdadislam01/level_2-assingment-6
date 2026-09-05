import { prisma } from '../../config/prisma.js';
import { ProjectStatus, Prisma } from '@prisma/client';
import { ApiError } from '../../errors/ApiError.js';
import { calculatePagination, IPaginationOptions } from '../../utils/pagination.js';

interface IProjectFilterOptions {
  search?: string;
  organizationId?: string;
  status?: ProjectStatus;
}

const createProject = async (payload: {
  name: string;
  key: string;
  description?: string;
  organizationId: string;
  teamId?: string;
  managerId?: string;
}) => {
  const org = await prisma.organization.findFirst({
    where: { id: payload.organizationId, deletedAt: null },
  });

  if (!org) {
    throw new ApiError(404, 'Organization not found');
  }

  return await prisma.project.create({
    data: {
      name: payload.name,
      key: payload.key.toUpperCase(),
      description: payload.description,
      organizationId: payload.organizationId,
      teamId: payload.teamId,
      managerId: payload.managerId,
    },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      manager: { select: { id: true, name: true, email: true } },
    },
  });
};

const getAllProjects = async (filters: IProjectFilterOptions, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { search, organizationId, status } = filters;

  const andConditions: Prisma.ProjectWhereInput[] = [{ deletedAt: null }];

  if (organizationId) {
    andConditions.push({ organizationId });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const whereConditions: Prisma.ProjectWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.project.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true, sprints: true } },
      },
    }),
    prisma.project.count({ where: whereConditions }),
  ]);

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: result,
  };
};

const getProjectById = async (id: string) => {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      manager: { select: { id: true, name: true, email: true } },
      sprints: {
        select: { id: true, name: true, status: true, startDate: true, endDate: true },
      },
      tasks: {
        where: { deletedAt: null },
        take: 10,
        select: { id: true, title: true, priority: true, status: true, assignee: { select: { id: true, name: true } } },
      },
      _count: { select: { tasks: true, sprints: true } },
    },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return project;
};

const updateProject = async (id: string, payload: Partial<{ name: string; description: string; status: ProjectStatus; managerId: string }>) => {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return await prisma.project.update({
    where: { id },
    data: payload,
  });
};

const deleteProject = async (id: string) => {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export const projectService = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
