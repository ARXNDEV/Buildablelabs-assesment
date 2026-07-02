import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

/**
 * Shared-secret auth. Every /api request must carry `x-api-key` matching the
 * server's API_KEY. Simple and sufficient for a single-user deployment; the
 * real value is keeping the public endpoint from being world-writable.
 *
 * A constant-time-ish comparison avoids leaking length/short-circuit timing.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const provided = req.header('x-api-key') ?? '';
  const expected = env.API_KEY;

  let mismatch = provided.length === expected.length ? 0 : 1;
  for (let i = 0; i < Math.max(provided.length, expected.length); i++) {
    mismatch |= (provided.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }

  if (mismatch !== 0) {
    res.status(401).json({ error: { message: 'Invalid or missing API key', code: 'unauthorized' } });
    return;
  }
  next();
}
