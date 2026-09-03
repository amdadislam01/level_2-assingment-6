import bcrypt from 'bcryptjs';
import { UserRole, SubscriptionPlan } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../errors/ApiError.js';
import { httpStatus } from '../../constants/httpStatus.js';
import { createToken, verifyToken } from '../../utils/jwtHelpers.js';
import { env } from '../../config/env.js';

export interface IRegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  organizationName?: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IGoogleLoginInput {
  email: string;
  name: string;
  googleId: string;
  avatarUrl?: string;
}

export interface IAuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

const registerUser = async (payload: IRegisterInput): Promise<IAuthResult> => {
  const { name, email, password, role = UserRole.MEMBER, organizationName } = payload;

  // 1. Check duplicate email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'An account with this email address already exists.');
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Execute Prisma Transaction: Create User + Organization + OrganizationMember
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isEmailVerified: true,
      },
    });

    const orgName = organizationName || `${name}'s Workspace`;
    const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const organization = await tx.organization.create({
      data: {
        name: orgName,
        slug,
        ownerId: user.id,
        plan: SubscriptionPlan.FREE,
      },
    });

    await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: user.role,
      },
    });

    // Create initial Activity Log
    await tx.activityLog.create({
      data: {
        action: 'USER_REGISTERED',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        organizationId: organization.id,
        details: { email: user.email, role: user.role, organizationName: orgName },
      },
    });

    return user;
  });

  // 4. Generate JWT Tokens
  const tokenPayload = {
    id: result.id,
    email: result.email,
    role: result.role,
    name: result.name,
  };

  const accessToken = createToken(tokenPayload, env.jwt.secret, env.jwt.expiresIn);
  const refreshToken = createToken(tokenPayload, env.jwt.refreshSecret, env.jwt.refreshExpiresIn);

  return {
    user: {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      avatarUrl: result.avatarUrl,
    },
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: ILoginInput): Promise<IAuthResult> => {
  const { email, password } = payload;

  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.deletedAt) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials or user account does not exist.');
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account has been deactivated. Please contact support.');
  }

  if (!user.password) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This account was registered using GCP Social Login. Please sign in with Google.'
    );
  }

  // 2. Verify password
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password.');
  }

  // 3. Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = createToken(tokenPayload, env.jwt.secret, env.jwt.expiresIn);
  const refreshToken = createToken(tokenPayload, env.jwt.refreshSecret, env.jwt.refreshExpiresIn);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string): Promise<{ accessToken: string }> => {
  const verifiedToken = verifyToken(token, env.jwt.refreshSecret);

  const user = await prisma.user.findUnique({
    where: { id: verifiedToken.id },
  });

  if (!user || user.deletedAt || !user.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User associated with refresh token is invalid or inactive.');
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const newAccessToken = createToken(tokenPayload, env.jwt.secret, env.jwt.expiresIn);

  return { accessToken: newAccessToken };
};

const googleLogin = async (payload: IGoogleLoginInput): Promise<IAuthResult> => {
  const { email, name, googleId, avatarUrl } = payload;

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Create new GCP Social user
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          googleId,
          avatarUrl,
          role: UserRole.MEMBER,
          isEmailVerified: true,
        },
      });

      const orgName = `${name}'s Workspace`;
      const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          ownerId: newUser.id,
          plan: SubscriptionPlan.FREE,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: newUser.id,
          role: newUser.role,
        },
      });

      return newUser;
    });
  } else {
    // Update googleId if missing
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatarUrl: avatarUrl || user.avatarUrl },
      });
    }
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = createToken(tokenPayload, env.jwt.secret, env.jwt.expiresIn);
  const refreshToken = createToken(tokenPayload, env.jwt.refreshSecret, env.jwt.refreshExpiresIn);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken,
  };
};

export const authService = {
  registerUser,
  loginUser,
  refreshToken,
  googleLogin,
};
