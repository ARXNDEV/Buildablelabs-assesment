import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import type { Theme } from '../lib/theme';

export type FilterKey = 'all' | 'today' | 'upcoming' | 'done';

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'done', label: 'Done' },
];

export function FilterTabs({
  active,
  onChange,
  counts,
  theme,
}: {
  active: FilterKey;
  onChange: (k: FilterKey) => void;
  counts: Record<FilterKey, number>;
  theme: Theme;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {TABS.map((tab) => {
        const on = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tab,
              { backgroundColor: on ? theme.primary : theme.surface, borderColor: on ? theme.primary : theme.border },
            ]}
          >
            <Text style={[styles.label, { color: on ? theme.onPrimary : theme.textMuted }]}>{tab.label}</Text>
            <View style={[styles.badge, { backgroundColor: on ? theme.onPrimary + '33' : theme.surfaceAlt }]}>
              <Text style={[styles.badgeText, { color: on ? theme.onPrimary : theme.textFaint }]}>
                {counts[tab.key]}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 10,
  },
  label: { fontSize: 13.5, fontWeight: '700' },
  badge: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, alignItems: 'center' },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
