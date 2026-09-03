import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../errors/ApiError.js';
import { httpStatus } from '../../constants/httpStatus.js';

export interface IUpdateProfileInput {
  name?: string;
  avatarUrl?: string;
  oldPassword?: string;
  newPassword?: string;
}

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      isEmailVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      orgMemberships: {
        select: {
          role: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
            },
          },
        },
      },
      managedProjects: {
        select: {
          id: true,
          name: true,
          key: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found.');
  }

  return user;
};

const updateMe = async (userId: string, payload: IUpdateProfileInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.deletedAt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  const updateData: Record<string, unknown> = {};

  if (payload.name) updateData.name = payload.name;
  if (payload.avatarUrl !== undefined) updateData.avatarUrl = payload.avatarUrl;

  // Handle password update if requested
  if (payload.newPassword) {
    if (!payload.oldPassword && user.password) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Old password is required to set a new password.');
    }

    if (user.password && payload.oldPassword) {
      const isMatch = await bcrypt.compare(payload.oldPassword, user.password);
      if (!isMatch) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Current password entered is incorrect.');
      }
    }

    updateData.password = await bcrypt.hash(payload.newPassword, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const getAllUsers = async (page = 1, limit = 10, search?: string) => {
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: users,
  };
};

export const userService = {
  getMe,
  updateMe,
  getAllUsers,
};
