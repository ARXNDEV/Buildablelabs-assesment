import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TaskForm } from '../components/TaskForm';
import { useCreateTask } from '../lib/queries';
import { toMessage } from '../lib/api';
import { useTheme } from '../lib/theme';

export default function NewTask() {
  const theme = useTheme();
  const create = useCreateTask();

  return (
    <TaskForm
      theme={theme}
      submitLabel="Create task"
      submitting={create.isPending}
      initial={{ title: '', description: '', priority: 'medium', due_at: null }}
      onSubmit={(values) => {
        create.mutate(
          {
            title: values.title,
            description: values.description || null,
            priority: values.priority,
            due_at: values.due_at,
          },
          {
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            },
            onError: (e) => Alert.alert('Could not create task', toMessage(e)),
          },
        );
      }}
    />
  );
}
