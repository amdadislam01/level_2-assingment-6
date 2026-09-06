import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    errors: [
      {
        field: 'rateLimit',
        message: 'Rate limit exceeded. Maximum 100 requests per 15 minutes allowed.',
      },
    ],
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Strict rate limit for auth endpoints (login/register)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    errors: [
      {
        field: 'rateLimit',
        message: 'Auth rate limit exceeded. Please wait 15 minutes.',
      },
    ],
  },
});
