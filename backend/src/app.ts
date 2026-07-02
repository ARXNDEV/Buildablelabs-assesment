import express from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { requireApiKey } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import tasksRouter from './routes/tasks.js';
import healthRouter from './routes/health.js';

export function createApp() {
  const app = express();

  app.use(
    pinoHttp({
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
      redact: ['req.headers["x-api-key"]'],
    }),
  );
  app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') }));
  app.use(express.json({ limit: '1mb' }));

  // Public liveness probe (used by Render health checks).
  app.use('/health', healthRouter);

  // Everything under /api requires the shared API key.
  app.use('/api', requireApiKey);
  app.use('/api/tasks', tasksRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
