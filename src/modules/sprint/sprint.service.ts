import { prisma } from '../../config/prisma.js';
import { SprintStatus } from '@prisma/client';
import { ApiError } from '../../errors/ApiError.js';

const createSprint = async (payload: {
  name: string;
  goal?: string;
  projectId: string;
  startDate: string;
  endDate: string;
}) => {
  const project = await prisma.project.findFirst({
    where: { id: payload.projectId, deletedAt: null },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return await prisma.sprint.create({
    data: {
      name: payload.name,
      goal: payload.goal,
      projectId: payload.projectId,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
    },
  });
};

const getSprintsByProjectId = async (projectId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return await prisma.sprint.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { tasks: true } },
    },
  });
};

const updateSprintStatus = async (sprintId: string, status: SprintStatus) => {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
  });

  if (!sprint) {
    throw new ApiError(404, 'Sprint not found');
  }

  return await prisma.sprint.update({
    where: { id: sprintId },
    data: { status },
  });
};

export const sprintService = {
  createSprint,
  getSprintsByProjectId,
  updateSprintStatus,
};
