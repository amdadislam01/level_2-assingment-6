import { RequestHandler } from 'express';

export const notFound: RequestHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.method} ${req.originalUrl}`,
    errors: [
      {
        path: req.originalUrl,
        message: 'The requested endpoint does not exist on this server',
      },
    ],
  });
};
