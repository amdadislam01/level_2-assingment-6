import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../types/express.d.js';

export const createToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expireTime: string
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: expireTime as SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};
