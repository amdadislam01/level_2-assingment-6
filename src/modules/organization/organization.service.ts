import { prisma } from '../../config/prisma.js';
import { UserRole, Prisma } from '@prisma/client';
import { ApiError } from '../../errors/ApiError.js';
import { calculatePagination, IPaginationOptions } from '../../utils/pagination.js';

interface IOrgFilterOptions {
  search?: string;
}

const createOrganization = async (ownerId: string, payload: { name: string; slug: string; logoUrl?: string }) => {
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: payload.slug },
  });

  if (existingOrg) {
    throw new ApiError(400, 'Organization slug already exists');
  }

  // Create organization and automatically add owner as OrganizationMember in a Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        logoUrl: payload.logoUrl,
        ownerId,
      },
    });

    await tx.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: ownerId,
        role: UserRole.ADMIN,
      },
    });

    return org;
  });
};

const getAllOrganizations = async (filters: IOrgFilterOptions, options: IPaginationOptions, userId: string) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { search } = filters;

  const andConditions: Prisma.OrganizationWhereInput[] = [
    { deletedAt: null },
    {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
  ];

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const whereConditions: Prisma.OrganizationWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.organization.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, projects: true } },
      },
    }),
    prisma.organization.count({ where: whereConditions }),
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

const getOrganizationById = async (id: string) => {
  const org = await prisma.organization.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        },
      },
      projects: {
        where: { deletedAt: null },
        select: { id: true, name: true, key: true, status: true, createdAt: true },
      },
    },
  });

  if (!org) {
    throw new ApiError(404, 'Organization not found');
  }

  return org;
};

const updateOrganization = async (id: string, payload: { name?: string; logoUrl?: string }) => {
  const org = await prisma.organization.findFirst({
    where: { id, deletedAt: null },
  });

  if (!org) {
    throw new ApiError(404, 'Organization not found');
  }

  return await prisma.organization.update({
    where: { id },
    data: payload,
  });
};

const deleteOrganization = async (id: string) => {
  const org = await prisma.organization.findFirst({
    where: { id, deletedAt: null },
  });

  if (!org) {
    throw new ApiError(404, 'Organization not found');
  }

  // Soft delete
  return await prisma.organization.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

const addMember = async (organizationId: string, payload: { userEmail: string; role?: UserRole }) => {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, deletedAt: null },
  });

  if (!org) {
    throw new ApiError(404, 'Organization not found');
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.userEmail },
  });

  if (!user) {
    throw new ApiError(404, 'User with this email not found');
  }

  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id,
      },
    },
  });

  if (existingMember) {
    throw new ApiError(400, 'User is already a member of this organization');
  }

  return await prisma.organizationMember.create({
    data: {
      organizationId,
      userId: user.id,
      role: payload.role || UserRole.MEMBER,
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
};

export const organizationService = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  addMember,
};
