import { supabase, TASKS_TABLE } from '../lib/supabase.js';
import type { CreateTaskInput, ListQuery, UpdateTaskInput } from '../schemas/task.js';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_at: string | null;
  completed_at: string | null;
  source: 'mobile' | 'email' | 'api';
  reminded_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Columns the API exposes (never leak deleted_at internals accidentally, but it's harmless). */
const SELECT = '*';

/** Small typed error the route layer maps to an HTTP status. */
export class NotFoundError extends Error {
  status = 404;
  constructor(message = 'Task not found') {
    super(message);
  }
}

/** Wrap Supabase errors into thrown errors so routes can rely on try/catch. */
function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new NotFoundError();
  return data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const row = {
    title: input.title,
    description: input.description ?? null,
    status: input.status,
    priority: input.priority,
    due_at: input.due_at ?? null,
    source: input.source,
    completed_at: input.status === 'done' ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase.from(TASKS_TABLE).insert(row).select(SELECT).single();
  return unwrap(data as Task | null, error);
}

export async function listTasks(query: ListQuery): Promise<Task[]> {
  let q = supabase.from(TASKS_TABLE).select(SELECT).is('deleted_at', null);

  if (query.status) q = q.eq('status', query.status);
  else if (query.include_completed === false) q = q.eq('status', 'todo');

  if (query.priority) q = q.eq('priority', query.priority);
  if (query.q) q = q.ilike('title', `%${query.q}%`);
  if (query.due_before) q = q.lte('due_at', query.due_before);
  if (query.due_after) q = q.gte('due_at', query.due_after);

  // Open tasks first ('todo' > 'done' when descending), then soonest due, then newest.
  q = q
    .order('status', { ascending: false })
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}

export async function getTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .select(SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError();
  return data as Task;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  // Ensure it exists (and isn't soft-deleted) before patching.
  await getTask(id);

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.due_at !== undefined) patch.due_at = input.due_at;
  if (input.status !== undefined) {
    patch.status = input.status;
    // Keep completed_at consistent with the status transition.
    patch.completed_at = input.status === 'done' ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .update(patch)
    .eq('id', id)
    .is('deleted_at', null)
    .select(SELECT)
    .single();
  return unwrap(data as Task | null, error);
}

export async function softDeleteTask(id: string): Promise<void> {
  await getTask(id);
  const { error } = await supabase
    .from(TASKS_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);
  if (error) throw new Error(error.message);
}

/** Open tasks that are overdue or due before end-of-day today — for daily reminders. */
export async function getReminderTasks(): Promise<Task[]> {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .select(SELECT)
    .is('deleted_at', null)
    .eq('status', 'todo')
    .not('due_at', 'is', null)
    .lte('due_at', endOfToday.toISOString())
    .order('due_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}

export async function markReminded(ids: string[]): Promise<number> {
  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .update({ reminded_at: new Date().toISOString() })
    .in('id', ids)
    .select('id');
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export interface Digest {
  generatedAt: string;
  completedThisWeek: number;
  createdThisWeek: number;
  pending: number;
  overdue: number;
  dueThisWeek: Task[];
  byPriority: { low: number; medium: number; high: number };
}

/** Weekly rollup consumed by the email-digest workflow. */
export async function getDigest(): Promise<Digest> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Pull every live task once, then aggregate in-process (dataset is tiny).
  const { data, error } = await supabase.from(TASKS_TABLE).select(SELECT).is('deleted_at', null);
  if (error) throw new Error(error.message);
  const tasks = (data ?? []) as Task[];

  const pendingTasks = tasks.filter((t) => t.status === 'todo');

  return {
    generatedAt: now.toISOString(),
    completedThisWeek: tasks.filter((t) => t.status === 'done' && t.completed_at && t.completed_at >= weekAgo).length,
    createdThisWeek: tasks.filter((t) => t.created_at >= weekAgo).length,
    pending: pendingTasks.length,
    overdue: pendingTasks.filter((t) => t.due_at && t.due_at < now.toISOString()).length,
    dueThisWeek: pendingTasks
      .filter((t) => t.due_at && t.due_at >= now.toISOString() && t.due_at <= weekAhead)
      .sort((a, b) => (a.due_at! < b.due_at! ? -1 : 1)),
    byPriority: {
      low: pendingTasks.filter((t) => t.priority === 'low').length,
      medium: pendingTasks.filter((t) => t.priority === 'medium').length,
      high: pendingTasks.filter((t) => t.priority === 'high').length,
    },
  };
}
