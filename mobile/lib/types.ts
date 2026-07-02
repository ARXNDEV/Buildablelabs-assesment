export type TaskStatus = 'todo' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskSource = 'mobile' | 'email' | 'api';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  completed_at: string | null;
  source: TaskSource;
  reminded_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  due_at?: string | null;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  due_at?: string | null;
  status?: TaskStatus;
}
