import { PrismaClient, UserRole, SubscriptionPlan, ProjectStatus, SprintStatus, TaskPriority, TaskStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting database seed...');

  // 1. Clear existing data in reverse order of dependencies
  await prisma.activityLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  const managerPassword = await bcrypt.hash('Manager@123456', 10);
  const memberPassword = await bcrypt.hash('Member@123456', 10);

  // 3. Create Demo Users (3 distinct roles)
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@saas.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: 'Project Manager',
      email: 'manager@saas.com',
      password: managerPassword,
      role: UserRole.MANAGER,
      isEmailVerified: true,
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      name: 'Dev Member',
      email: 'member@saas.com',
      password: memberPassword,
      role: UserRole.MEMBER,
      isEmailVerified: true,
    },
  });

  console.log('[SEED] Created Demo Users:');
  console.log('   - Admin: admin@saas.com / Admin@123456');
  console.log('   - Manager: manager@saas.com / Manager@123456');
  console.log('   - Member: member@saas.com / Member@123456');

  // 4. Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Acme SaaS Corp',
      slug: 'acme-saas-corp',
      ownerId: adminUser.id,
      plan: SubscriptionPlan.PRO,
    },
  });

  // 5. Add Members to Organization
  await prisma.organizationMember.createMany({
    data: [
      { organizationId: organization.id, userId: adminUser.id, role: UserRole.ADMIN },
      { organizationId: organization.id, userId: managerUser.id, role: UserRole.MANAGER },
      { organizationId: organization.id, userId: memberUser.id, role: UserRole.MEMBER },
    ],
  });

  // 6. Create Team
  const devTeam = await prisma.team.create({
    data: {
      name: 'Engineering Team Alpha',
      description: 'Core backend and cloud infrastructure team',
      organizationId: organization.id,
    },
  });

  const managerOrgMember = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: managerUser.id,
      },
    },
  });

  const memberOrgMember = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: memberUser.id,
      },
    },
  });

  if (managerOrgMember && memberOrgMember) {
    await prisma.teamMember.createMany({
      data: [
        { teamId: devTeam.id, orgMemberId: managerOrgMember.id },
        { teamId: devTeam.id, orgMemberId: memberOrgMember.id },
      ],
    });
  }

  // 7. Create Project
  const project = await prisma.project.create({
    data: {
      name: 'Cloud Platform Re-architecting',
      key: 'CPR',
      description: 'Migrating legacy monolith to Microservices RESTful SaaS API',
      organizationId: organization.id,
      teamId: devTeam.id,
      managerId: managerUser.id,
      status: ProjectStatus.ACTIVE,
    },
  });

  // 8. Create Sprint
  const sprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 - Foundation & Auth',
      goal: 'Deliver core authentication, RBAC, and Prisma setup',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: SprintStatus.ACTIVE,
      projectId: project.id,
    },
  });

  // 9. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Configure Express, TypeScript & Prisma ORM',
      description: 'Set up base directory structure, TypeScript config, and PostgreSQL schema',
      priority: TaskPriority.HIGH,
      status: TaskStatus.DONE,
      projectId: project.id,
      sprintId: sprint.id,
      creatorId: managerUser.id,
      assigneeId: memberUser.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Implement JWT Auth & Zod Validation Middleware',
      description: 'Create user authentication handlers, password hashing, and strict route validation',
      priority: TaskPriority.URGENT,
      status: TaskStatus.IN_PROGRESS,
      projectId: project.id,
      sprintId: sprint.id,
      creatorId: managerUser.id,
      assigneeId: memberUser.id,
    },
  });

  // 10. Subtasks
  await prisma.subtask.createMany({
    data: [
      { title: 'Create tsconfig.json and package.json', isCompleted: true, taskId: task1.id, createdById: memberUser.id },
      { title: 'Define schema.prisma models', isCompleted: true, taskId: task1.id, createdById: memberUser.id },
      { title: 'Write Zod validation schemas', isCompleted: false, taskId: task2.id, createdById: memberUser.id },
    ],
  });

  // 11. Comments
  await prisma.comment.create({
    data: {
      content: 'Day 1 foundation looks rock solid! Schema matches all requirements.',
      taskId: task1.id,
      userId: adminUser.id,
    },
  });

  // 12. Payment record demo
  await prisma.payment.create({
    data: {
      transactionId: 'TXN-DEMO-20260902-001',
      amount: 49.99,
      currency: 'USD',
      paymentMethod: PaymentMethod.STRIPE,
      status: PaymentStatus.COMPLETED,
      userId: adminUser.id,
      organizationId: organization.id,
      plan: SubscriptionPlan.PRO,
      gatewayResponse: { receipt: 'ch_mock_receipt_12345' },
    },
  });

  // 13. Activity Log
  await prisma.activityLog.create({
    data: {
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project.id,
      userId: managerUser.id,
      organizationId: organization.id,
      details: { projectName: project.name, key: project.key },
    },
  });

  console.log('[SEED] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[ERROR] Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
