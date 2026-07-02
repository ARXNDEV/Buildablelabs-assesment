import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { priorityColor, PRIORITY_LABEL, type Theme } from '../lib/theme';
import { formatFullDate } from '../lib/format';
import type { TaskPriority } from '../lib/types';

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  due_at: string | null;
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export function TaskForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
  theme,
}: {
  initial: TaskFormValues;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (v: TaskFormValues) => void;
  theme: Theme;
}) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [priority, setPriority] = useState<TaskPriority>(initial.priority);
  const [dueAt, setDueAt] = useState<string | null>(initial.due_at);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [draftDate, setDraftDate] = useState<Date | null>(null);

  const canSave = title.trim().length > 0 && !submitting;

  function handlePicked(event: DateTimePickerEvent, selected?: Date) {
    if (event.type === 'dismissed' || !selected) {
      setPickerMode(null);
      setDraftDate(null);
      return;
    }
    if (Platform.OS === 'ios') {
      // iOS: single inline datetime picker; onChange fires while scrolling, so
      // just track the value and let the "Done" button dismiss it.
      setDueAt(selected.toISOString());
      return;
    }
    // Android: pick date, then time (onChange fires once per step).
    if (pickerMode === 'date') {
      setDraftDate(selected);
      setPickerMode('time');
    } else {
      const base = draftDate ?? new Date();
      base.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setDueAt(base.toISOString());
      setPickerMode(null);
      setDraftDate(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[styles.label, { color: theme.textMuted }]}>Title</Text>
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
        placeholder="What needs doing?"
        placeholderTextColor={theme.textFaint}
        value={title}
        onChangeText={setTitle}
        autoFocus={!initial.title}
      />

      <Text style={[styles.label, { color: theme.textMuted }]}>Notes</Text>
      <TextInput
        style={[
          styles.input,
          styles.multiline,
          { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        placeholder="Add details (optional)"
        placeholderTextColor={theme.textFaint}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={[styles.label, { color: theme.textMuted }]}>Priority</Text>
      <View style={styles.segment}>
        {PRIORITIES.map((p) => {
          const on = priority === p;
          const color = priorityColor(p, theme);
          return (
            <Pressable
              key={p}
              onPress={() => setPriority(p)}
              style={[
                styles.segItem,
                { backgroundColor: on ? color + '22' : theme.surface, borderColor: on ? color : theme.border },
              ]}
            >
              <View style={[styles.segDot, { backgroundColor: color }]} />
              <Text style={[styles.segText, { color: on ? color : theme.textMuted }]}>{PRIORITY_LABEL[p]}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: theme.textMuted }]}>Due date</Text>
      <View style={styles.dueRow}>
        <Pressable
          style={[styles.dueBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setPickerMode('date')}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.primary} />
          <Text style={[styles.dueText, { color: dueAt ? theme.text : theme.textFaint }]}>
            {dueAt ? formatFullDate(dueAt) : 'No due date'}
          </Text>
        </Pressable>
        {dueAt && (
          <Pressable hitSlop={8} onPress={() => setDueAt(null)} style={styles.clearDue}>
            <Ionicons name="close-circle" size={22} color={theme.textFaint} />
          </Pressable>
        )}
      </View>

      {pickerMode && (
        <View>
          <DateTimePicker
            value={dueAt ? new Date(dueAt) : new Date()}
            mode={Platform.OS === 'ios' ? 'datetime' : pickerMode}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handlePicked}
          />
          {Platform.OS === 'ios' && (
            <Pressable style={styles.pickerDone} onPress={() => setPickerMode(null)}>
              <Text style={[styles.pickerDoneText, { color: theme.primary }]}>Done</Text>
            </Pressable>
          )}
        </View>
      )}

      <Pressable
        disabled={!canSave}
        onPress={() =>
          onSubmit({ title: title.trim(), description: description.trim(), priority, due_at: dueAt })
        }
        style={[styles.save, { backgroundColor: canSave ? theme.primary : theme.border }]}
      >
        <Text style={[styles.saveText, { color: canSave ? theme.onPrimary : theme.textFaint }]}>
          {submitting ? 'Saving…' : submitLabel}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 2 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15.5 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  segment: { flexDirection: 'row', gap: 8 },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
  },
  segDot: { width: 8, height: 8, borderRadius: 4 },
  segText: { fontSize: 14, fontWeight: '700' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dueText: { fontSize: 15 },
  clearDue: { padding: 4 },
  pickerDone: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 8 },
  pickerDoneText: { fontSize: 16, fontWeight: '700' },
  save: { marginTop: 24, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '700' },
});
