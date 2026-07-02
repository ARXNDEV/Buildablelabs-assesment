import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createTaskSchema, updateTaskSchema } from '../src/schemas/task.js';

const app = createApp();
const KEY = process.env.API_KEY as string;

describe('health', () => {
  it('is public and returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('auth gate', () => {
  it('rejects /api without an API key', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('rejects a wrong API key', async () => {
    const res = await request(app).get('/api/tasks').set('x-api-key', 'nope');
    expect(res.status).toBe(401);
  });
});

describe('validation', () => {
  it('rejects task creation with no title (400, not 500)', async () => {
    const res = await request(app).post('/api/tasks').set('x-api-key', KEY).send({ description: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('rejects an empty PATCH body', async () => {
    const res = await request(app)
      .patch('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('x-api-key', KEY)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
  });
});

describe('zod schemas', () => {
  it('applies defaults on create', () => {
    const parsed = createTaskSchema.parse({ title: 'Buy milk' });
    expect(parsed.status).toBe('todo');
    expect(parsed.priority).toBe('medium');
    expect(parsed.source).toBe('mobile');
  });

  it('coerces empty due_at to null', () => {
    const parsed = createTaskSchema.parse({ title: 'x', due_at: '' });
    expect(parsed.due_at).toBeNull();
  });

  it('rejects an invalid priority', () => {
    expect(() => createTaskSchema.parse({ title: 'x', priority: 'urgent' })).toThrow();
  });

  it('requires at least one field on update', () => {
    expect(() => updateTaskSchema.parse({})).toThrow();
  });
});
