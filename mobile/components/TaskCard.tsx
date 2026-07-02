import { useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Checkbox } from './Checkbox';
import { PriorityBadge, DueChip, SourceBadge } from './Badges';
import type { Theme } from '../lib/theme';
import type { Task } from '../lib/types';

/** Coloured panel revealed behind the card while swiping. */
function ActionPanel({
  side,
  color,
  icon,
  label,
}: {
  side: 'left' | 'right';
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={[styles.action, { backgroundColor: color, alignItems: side === 'left' ? 'flex-start' : 'flex-end' }]}>
      <View style={styles.actionInner}>
        <Ionicons name={icon} size={22} color="#fff" />
        <Text style={styles.actionText}>{label}</Text>
      </View>
    </View>
  );
}

export function TaskCard({
  task,
  theme,
  onToggle,
  onDelete,
  onPress,
}: {
  task: Task;
  theme: Theme;
  onToggle: () => void;
  onDelete: () => void;
  onPress: () => void;
}) {
  const ref = useRef<SwipeableMethods>(null);
  const done = task.status === 'done';

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      leftThreshold={64}
      rightThreshold={64}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <ActionPanel side="left" color={theme.success} icon={done ? 'arrow-undo' : 'checkmark-done'} label={done ? 'Reopen' : 'Complete'} />
      )}
      renderRightActions={() => (
        <ActionPanel side="right" color={theme.danger} icon="trash" label="Delete" />
      )}
      onSwipeableOpen={(direction) => {
        if (direction === 'left') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onToggle();
          ref.current?.close();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete();
        }
      }}
    >
      <Pressable
        onPress={onPress}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}
      >
        <Checkbox
          done={done}
          theme={theme}
          onToggle={() => {
            Haptics.selectionAsync();
            onToggle();
          }}
        />
        <View style={styles.body}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              { color: theme.text },
              done && { color: theme.textFaint, textDecorationLine: 'line-through' },
            ]}
          >
            {task.title}
          </Text>
          {!!task.description && (
            <Text numberOfLines={1} style={[styles.desc, { color: theme.textMuted }]}>
              {task.description}
            </Text>
          )}
          <View style={styles.metaRow}>
            <PriorityBadge priority={task.priority} theme={theme} />
            <DueChip dueAt={task.due_at} done={done} theme={theme} />
            {task.source === 'email' && <SourceBadge theme={theme} />}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textFaint} />
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 15.5, fontWeight: '600', lineHeight: 21 },
  desc: { fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  action: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: 16,
    marginVertical: 0,
    paddingHorizontal: 22,
  },
  actionInner: { alignItems: 'center', gap: 2 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
