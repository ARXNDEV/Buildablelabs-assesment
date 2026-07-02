import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from './api';
import type { CreateTaskInput, Task, UpdateTaskInput } from './types';

const KEY = ['tasks'] as const;

export function useTasks() {
  return useQuery({ queryKey: KEY, queryFn: tasksApi.list });
}

/** Optimistically insert a placeholder task; reconcile on success/error. */
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Task[]>(KEY) ?? [];
      const now = new Date().toISOString();
      const optimistic: Task = {
        id: `temp-${Date.now()}`,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? 'todo',
        priority: input.priority ?? 'medium',
        due_at: input.due_at ?? null,
        completed_at: null,
        source: 'mobile',
        reminded_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      qc.setQueryData<Task[]>(KEY, [optimistic, ...prev]);
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(KEY, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => tasksApi.update(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Task[]>(KEY) ?? [];
      qc.setQueryData<Task[]>(
        KEY,
        prev.map((t) => (t.id === id ? { ...t, ...input } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(KEY, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Toggle done/todo with matching completed_at so the UI updates instantly. */
export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      tasksApi.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Task[]>(KEY) ?? [];
      const completed_at = status === 'done' ? new Date().toISOString() : null;
      qc.setQueryData<Task[]>(
        KEY,
        prev.map((t) => (t.id === id ? { ...t, status, completed_at } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(KEY, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Task[]>(KEY) ?? [];
      qc.setQueryData<Task[]>(KEY, prev.filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(KEY, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
