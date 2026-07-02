import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

/** 404 for unmatched routes. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: 'Route not found', code: 'not_found' } });
}

/**
 * Central error handler → consistent { error: { message, code } } shape.
 * Zod → 400, typed errors carrying `status` → that status, everything else 500
 * (with the detail logged but not leaked to the client).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    res.status(400).json({ error: { message, code: 'validation_error' } });
    return;
  }

  const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
  const rawMessage = err instanceof Error ? err.message : 'Unknown error';

  if (status >= 500) {
    req.log?.error({ err }, 'Unhandled error');
    res.status(500).json({ error: { message: 'Internal server error', code: 'internal_error' } });
    return;
  }

  res.status(status).json({ error: { message: rawMessage, code: 'request_error' } });
}
