-- ============================================================================
-- TaskFlow — Supabase schema
-- Apply once: Supabase Dashboard → SQL Editor → paste → Run.
-- Idempotent: safe to re-run.
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto (present by default on Supabase, but be safe).
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- tasks
-- ----------------------------------------------------------------------------
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 500),
  description   text,
  status        text not null default 'todo'   check (status   in ('todo', 'done')),
  priority      text not null default 'medium'  check (priority in ('low', 'medium', 'high')),
  due_at        timestamptz,
  completed_at  timestamptz,
  source        text not null default 'mobile'  check (source   in ('mobile', 'email', 'api')),
  reminded_at   timestamptz,                              -- dedupes daily reminders
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz                               -- soft delete (no data loss)
);

comment on table public.tasks is 'TaskFlow tasks. Single-user scope for the assessment; soft-deleted rows kept for safety.';
comment on column public.tasks.source      is 'Where the task came from: mobile app, forwarded email (n8n), or generic API.';
comment on column public.tasks.reminded_at is 'Last time a due reminder was sent, used to avoid duplicate Discord pings.';
comment on column public.tasks.deleted_at  is 'Soft-delete marker; the API filters these out.';

-- ----------------------------------------------------------------------------
-- keep updated_at fresh on every write
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- indexes for the common query paths
-- ----------------------------------------------------------------------------
-- list open tasks / reminders ordered by due date
create index if not exists idx_tasks_status_due on public.tasks (status, due_at);
-- fast filtering of live (non-deleted) rows
create index if not exists idx_tasks_not_deleted on public.tasks (deleted_at) where deleted_at is null;
-- recency ordering
create index if not exists idx_tasks_created_at on public.tasks (created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- The backend uses the service_role key (which bypasses RLS), and the mobile
-- app never touches Supabase directly — it goes through the API. We still turn
-- RLS on so the anon/public key cannot read or write the table by default.
-- ----------------------------------------------------------------------------
alter table public.tasks enable row level security;
-- (No permissive policies for anon on purpose. Add Supabase Auth + per-user
--  policies here if this grows into a multi-user product.)

-- ----------------------------------------------------------------------------
-- Optional seed data — comment out if you want an empty table.
-- ----------------------------------------------------------------------------
insert into public.tasks (title, description, priority, due_at, source)
values
  ('Welcome to TaskFlow 👋', 'Swipe right to complete, left to delete. Tap to edit.', 'medium', now() + interval '2 hours', 'api'),
  ('Try creating a task from email', 'Forward any email to your TaskFlow inbox and watch it appear here.', 'low', now() + interval '2 days', 'api'),
  ('Ship the assessment 🚀', 'Backend + mobile + n8n automation, all wired together.', 'high', now() + interval '1 day', 'api')
on conflict do nothing;
