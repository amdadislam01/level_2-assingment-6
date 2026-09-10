import { Server } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

let server: Server;

async function bootstrap() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('[DATABASE] Connected successfully to PostgreSQL database via Prisma');

    server = app.listen(env.port, () => {
      console.log(`[SERVER] Server is listening on http://localhost:${env.port}`);
      console.log(`[SERVER] Health Check URL: http://localhost:${env.port}/api/v1/health`);
    });
  } catch (err) {
    console.error('[ERROR] Server startup error:', err);
    process.exit(1);
  }
}

// Graceful Unhandled Rejection & Uncaught Exception Handling
process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('[ERROR] Unhandled Rejection:', error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received. Gracefully shutting down server...');
  if (server) {
    server.close(() => {
      prisma.$disconnect();
      console.log('[SERVER] Server and database connection closed.');
    });
  }
});

bootstrap();

export default app;

