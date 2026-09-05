import { prisma } from '../../config/prisma.js';
import { calculatePagination, IPaginationOptions } from '../../utils/pagination.js';
import { Prisma } from '@prisma/client';

interface IActivityFilterOptions {
  organizationId?: string;
  taskId?: string;
  userId?: string;
}

const getActivityLogs = async (filters: IActivityFilterOptions, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { organizationId, taskId, userId } = filters;

  const andConditions: Prisma.ActivityLogWhereInput[] = [];

  if (organizationId) andConditions.push({ organizationId });
  if (taskId) andConditions.push({ taskId });
  if (userId) andConditions.push({ userId });

  const whereConditions: Prisma.ActivityLogWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.activityLog.count({ where: whereConditions }),
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

export const activityLogService = {
  getActivityLogs,
};
