/** Human-friendly relative labels for due dates. */

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayDiff(target: Date, base: Date): number {
  return Math.round((startOfDay(target).getTime() - startOfDay(base).getTime()) / 86_400_000);
}

export interface DueInfo {
  label: string;
  overdue: boolean;
  soon: boolean; // due today or tomorrow (and not done)
}

export function describeDue(dueAt: string | null, now: Date = new Date()): DueInfo | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const days = dayDiff(due, now);
  const time = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  let label: string;
  if (days === 0) label = `Today · ${time}`;
  else if (days === 1) label = `Tomorrow · ${time}`;
  else if (days === -1) label = `Yesterday · ${time}`;
  else if (days < 0) label = `${Math.abs(days)}d overdue`;
  else if (days < 7) label = due.toLocaleDateString(undefined, { weekday: 'short' }) + ` · ${time}`;
  else label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return { label, overdue: due.getTime() < now.getTime(), soon: days >= 0 && days <= 1 };
}

export function formatFullDate(iso: string | null): string {
  if (!iso) return 'No due date';
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
