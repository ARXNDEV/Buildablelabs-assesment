import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '../lib/theme';

export function EmptyState({
  icon = 'checkmark-circle-outline',
  title,
  subtitle,
  theme,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  theme: Theme;
}) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={40} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 8 },
  circle: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
