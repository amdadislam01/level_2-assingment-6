import { prisma } from '../../config/prisma.js';
import { TaskPriority, TaskStatus, Prisma } from '@prisma/client';
import { ApiError } from '../../errors/ApiError.js';
import { calculatePagination, IPaginationOptions } from '../../utils/pagination.js';

interface ITaskFilterOptions {
  search?: string;
  projectId?: string;
  sprintId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

const createTask = async (creatorId: string, payload: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  projectId: string;
  sprintId?: string;
  assigneeId?: string;
}) => {
  const project = await prisma.project.findFirst({
    where: { id: payload.projectId, deletedAt: null },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        title: payload.title,
        description: payload.description,
        priority: payload.priority || TaskPriority.MEDIUM,
        status: payload.status || TaskStatus.TODO,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        projectId: payload.projectId,
        sprintId: payload.sprintId,
        assigneeId: payload.assigneeId,
        creatorId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    // Create Audit Activity Log
    await tx.activityLog.create({
      data: {
        action: 'TASK_CREATED',
        entityType: 'TASK',
        entityId: task.id,
        details: { message: `Task "${task.title}" created` },
        userId: creatorId,
        organizationId: project.organizationId,
        taskId: task.id,
      },
    });

    return task;
  });
};

const getAllTasks = async (filters: ITaskFilterOptions, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { search, projectId, sprintId, assigneeId, status, priority } = filters;

  const andConditions: Prisma.TaskWhereInput[] = [{ deletedAt: null }];

  if (projectId) andConditions.push({ projectId });
  if (sprintId) andConditions.push({ sprintId });
  if (assigneeId) andConditions.push({ assigneeId });
  if (status) andConditions.push({ status });
  if (priority) andConditions.push({ priority });

  if (search) {
    andConditions.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const whereConditions: Prisma.TaskWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.task.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        project: { select: { id: true, name: true, key: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
    }),
    prisma.task.count({ where: whereConditions }),
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

const getTaskById = async (id: string) => {
  const task = await prisma.task.findFirst({
    where: { id, deletedAt: null },
    include: {
      project: { select: { id: true, name: true, key: true, organizationId: true } },
      sprint: { select: { id: true, name: true, status: true } },
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true } },
      subtasks: { orderBy: { createdAt: 'asc' } },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  return task;
};

const updateTask = async (id: string, payload: Partial<{
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  sprintId: string;
  assigneeId: string;
}>) => {
  const task = await prisma.task.findFirst({
    where: { id, deletedAt: null },
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const updateData: Prisma.TaskUpdateInput = { ...payload };
  if (payload.dueDate) {
    updateData.dueDate = new Date(payload.dueDate);
  }

  return await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
};

const updateTaskStatus = async (taskId: string, userId: string, newStatus: TaskStatus) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: { project: { select: { organizationId: true } } },
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const oldStatus = task.status;

  // PRISMA TRANSACTION: Atomic update of task status & creation of Activity Log audit record
  return await prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    const activity = await tx.activityLog.create({
      data: {
        action: 'TASK_STATUS_CHANGED',
        entityType: 'TASK',
        entityId: taskId,
        details: { message: `Task status changed from ${oldStatus} to ${newStatus}` },
        userId,
        organizationId: task.project.organizationId,
        taskId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      task: updatedTask,
      activity,
    };
  });
};

const deleteTask = async (id: string) => {
  const task = await prisma.task.findFirst({
    where: { id, deletedAt: null },
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  return await prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

const addComment = async (taskId: string, userId: string, content: string) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  return await prisma.comment.create({
    data: {
      taskId,
      userId,
      content,
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
};

const addSubtask = async (taskId: string, userId: string, title: string) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  return await prisma.subtask.create({
    data: {
      taskId,
      createdById: userId,
      title,
    },
  });
};

const toggleSubtask = async (subtaskId: string) => {
  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
  });

  if (!subtask) {
    throw new ApiError(404, 'Subtask not found');
  }

  return await prisma.subtask.update({
    where: { id: subtaskId },
    data: { isCompleted: !subtask.isCompleted },
  });
};

export const taskService = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  addSubtask,
  toggleSubtask,
};
