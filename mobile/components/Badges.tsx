import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { describeDue } from '../lib/format';
import { priorityColor, PRIORITY_LABEL, type Theme } from '../lib/theme';
import type { TaskPriority } from '../lib/types';

export function PriorityBadge({ priority, theme }: { priority: TaskPriority; theme: Theme }) {
  const color = priorityColor(priority, theme);
  return (
    <View style={[styles.pill, { backgroundColor: color + '1f' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{PRIORITY_LABEL[priority]}</Text>
    </View>
  );
}

export function DueChip({
  dueAt,
  done,
  theme,
}: {
  dueAt: string | null;
  done: boolean;
  theme: Theme;
}) {
  const info = describeDue(dueAt);
  if (!info) return null;
  const danger = info.overdue && !done;
  const color = danger ? theme.danger : theme.textMuted;
  return (
    <View style={styles.chip}>
      <Ionicons name={danger ? 'alert-circle' : 'time-outline'} size={13} color={color} />
      <Text style={[styles.chipText, { color }]}>{info.label}</Text>
    </View>
  );
}

export function SourceBadge({ theme }: { theme: Theme }) {
  return (
    <View style={[styles.chip, { backgroundColor: theme.primarySoft, borderRadius: 6, paddingHorizontal: 6 }]}>
      <Ionicons name="mail" size={12} color={theme.primary} />
      <Text style={[styles.chipText, { color: theme.primary, fontWeight: '600' }]}>Email</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  chipText: { fontSize: 12, fontWeight: '500' },
});
