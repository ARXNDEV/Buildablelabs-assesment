import { z } from 'zod';

export const STATUSES = ['todo', 'done'] as const;
export const PRIORITIES = ['low', 'medium', 'high'] as const;
export const SOURCES = ['mobile', 'email', 'api'] as const;

/** Accepts an ISO datetime string or null; empty string is treated as null. */
const nullableDate = z
  .union([z.string().datetime({ offset: true }), z.string().length(0), z.null()])
  .transform((v) => (v ? v : null))
  .optional();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(500),
  description: z.string().trim().max(5000).nullish(),
  status: z.enum(STATUSES).default('todo'),
  priority: z.enum(PRIORITIES).default('medium'),
  due_at: nullableDate,
  source: z.enum(SOURCES).default('mobile'),
});

/** All fields optional for PATCH; must send at least one. */
export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    description: z.string().trim().max(5000).nullable(),
    status: z.enum(STATUSES),
    priority: z.enum(PRIORITIES),
    due_at: nullableDate,
  })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  q: z.string().trim().max(200).optional(),
  due_before: z.string().datetime({ offset: true }).optional(),
  due_after: z.string().datetime({ offset: true }).optional(),
  include_completed: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const markRemindedSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'ids must be a non-empty array of task UUIDs'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
