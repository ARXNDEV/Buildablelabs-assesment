import axios from 'axios';
import type { CreateTaskInput, Task, UpdateTaskInput } from './types';

const baseURL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const apiKey = process.env.EXPO_PUBLIC_API_KEY ?? '';

export const client = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
});

/** Turn axios/network failures into readable messages for the UI. */
export function toMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const data = err.response.data as { error?: { message?: string } } | undefined;
      return data?.error?.message ?? `Request failed (${err.response.status})`;
    }
    return "Can't reach the server. Check your connection and that EXPO_PUBLIC_API_URL is correct.";
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

export const tasksApi = {
  async list(): Promise<Task[]> {
    const { data } = await client.get<{ data: Task[] }>('/api/tasks');
    return data.data;
  },
  async get(id: string): Promise<Task> {
    const { data } = await client.get<{ data: Task }>(`/api/tasks/${id}`);
    return data.data;
  },
  async create(input: CreateTaskInput): Promise<Task> {
    const { data } = await client.post<{ data: Task }>('/api/tasks', input);
    return data.data;
  },
  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const { data } = await client.patch<{ data: Task }>(`/api/tasks/${id}`, input);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await client.delete(`/api/tasks/${id}`);
  },
};
