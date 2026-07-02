import { View, Text, StyleSheet } from 'react-native';
import type { Theme } from '../lib/theme';

function Stat({ value, label, color, theme }: { value: number; label: string; color: string; theme: Theme }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

export function StatsHeader({
  open,
  overdue,
  doneToday,
  theme,
}: {
  open: number;
  overdue: number;
  doneToday: number;
  theme: Theme;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Stat value={open} label="Open" color={theme.primary} theme={theme} />
      <View style={[styles.sep, { backgroundColor: theme.border }]} />
      <Stat value={overdue} label="Overdue" color={theme.danger} theme={theme} />
      <View style={[styles.sep, { backgroundColor: theme.border }]} />
      <Stat value={doneToday} label="Done today" color={theme.success} theme={theme} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: 24, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '500' },
  sep: { width: 1, height: 32 },
});
