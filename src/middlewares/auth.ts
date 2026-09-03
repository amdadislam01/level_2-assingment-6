import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ApiError } from '../errors/ApiError.js';
import { httpStatus } from '../constants/httpStatus.js';
import { verifyToken } from '../utils/jwtHelpers.js';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export const auth = (...requiredRoles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Extract token from Authorization header or cookies
      let token = req.headers.authorization;
      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized to access this resource. Please log in.');
      }

      // 2. Verify token
      const verifiedUser = verifyToken(token, env.jwt.secret);

      // 3. Check if user still exists in database and is active
      const user = await prisma.user.findUnique({
        where: { id: verifiedUser.id },
      });

      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User associated with this token no longer exists.');
      }

      if (user.deletedAt || !user.isActive) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Your user account has been deactivated or suspended.');
      }

      // 4. Role-based Authorization check
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          `Access Forbidden! Your role '${user.role}' is not authorized to perform this operation.`
        );
      }

      // 5. Attach decoded user payload to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
