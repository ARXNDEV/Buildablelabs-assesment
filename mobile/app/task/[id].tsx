import { View, Text, Alert, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TaskForm } from '../../components/TaskForm';
import { useTasks, useUpdateTask, useToggleTask, useDeleteTask } from '../../lib/queries';
import { toMessage } from '../../lib/api';
import { useTheme } from '../../lib/theme';

export default function EditTask() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: tasks = [], isLoading } = useTasks();
  const task = tasks.find((t) => t.id === id);

  const update = useUpdateTask();
  const toggle = useToggleTask();
  const del = useDeleteTask();

  function confirmDelete() {
    Alert.alert('Delete task', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (!id) return;
          del.mutate(id, { onError: (e) => Alert.alert('Delete failed', toMessage(e)) });
          router.back();
        },
      },
    ]);
  }

  if (isLoading && !task) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Ionicons name="help-circle-outline" size={40} color={theme.textFaint} />
        <Text style={{ color: theme.textMuted, marginTop: 8 }}>Task not found.</Text>
      </View>
    );
  }

  const done = task.status === 'done';

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  Haptics.selectionAsync();
                  toggle.mutate({ id: task.id, status: done ? 'todo' : 'done' });
                }}
              >
                <Ionicons name={done ? 'arrow-undo-outline' : 'checkmark-done'} size={22} color={theme.success} />
              </Pressable>
              <Pressable hitSlop={8} onPress={confirmDelete}>
                <Ionicons name="trash-outline" size={22} color={theme.danger} />
              </Pressable>
            </View>
          ),
        }}
      />
      <TaskForm
        theme={theme}
        submitLabel="Save changes"
        submitting={update.isPending}
        initial={{
          title: task.title,
          description: task.description ?? '',
          priority: task.priority,
          due_at: task.due_at,
        }}
        onSubmit={(values) => {
          update.mutate(
            {
              id: task.id,
              input: {
                title: values.title,
                description: values.description || null,
                priority: values.priority,
                due_at: values.due_at,
              },
            },
            {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              },
              onError: (e) => Alert.alert('Could not save', toMessage(e)),
            },
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 18, alignItems: 'center' },
});
