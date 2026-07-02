import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTasks, useToggleTask, useDeleteTask } from '../lib/queries';
import { toMessage } from '../lib/api';
import { useTheme } from '../lib/theme';
import { TaskCard } from '../components/TaskCard';
import { FilterTabs, type FilterKey } from '../components/FilterTabs';
import { SearchBar } from '../components/SearchBar';
import { StatsHeader } from '../components/StatsHeader';
import { EmptyState } from '../components/EmptyState';
import type { Task } from '../lib/types';

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function Home() {
  const theme = useTheme();
  const { data: tasks = [], isLoading, isError, error, refetch, isRefetching } = useTasks();
  const toggle = useToggleTask();
  const del = useDeleteTask();

  const [tab, setTab] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const now = Date.now();
  const buckets = useMemo(() => {
    const open = tasks.filter((t) => t.status === 'todo');
    return {
      all: tasks,
      today: open.filter((t) => t.due_at && new Date(t.due_at).getTime() <= endOfToday()),
      upcoming: open.filter((t) => !t.due_at || new Date(t.due_at).getTime() > endOfToday()),
      done: tasks.filter((t) => t.status === 'done'),
    } satisfies Record<FilterKey, Task[]>;
  }, [tasks]);

  const counts: Record<FilterKey, number> = {
    all: buckets.all.length,
    today: buckets.today.length,
    upcoming: buckets.upcoming.length,
    done: buckets.done.length,
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return buckets[tab].filter(
      (t) => !q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q),
    );
  }, [buckets, tab, search]);

  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status === 'todo');
    return {
      open: open.length,
      overdue: open.filter((t) => t.due_at && new Date(t.due_at).getTime() < now).length,
      doneToday: tasks.filter((t) => t.status === 'done' && isToday(t.completed_at)).length,
    };
  }, [tasks, now]);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>TASKFLOW</Text>
          <Text style={[styles.h1, { color: theme.text }]}>My Tasks</Text>
        </View>
        <Pressable
          onPress={() => refetch()}
          hitSlop={10}
          style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons name="refresh" size={18} color={theme.textMuted} />
        </Pressable>
      </View>

      <SearchBar value={search} onChange={setSearch} theme={theme} />
      <View style={{ height: 8 }} />
      <FilterTabs active={tab} onChange={setTab} counts={counts} theme={theme} />

      {isLoading ? (
        <SkeletonList theme={theme} />
      ) : isError ? (
        <View style={styles.center}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load tasks"
            subtitle={toMessage(error)}
            theme={theme}
          />
          <Pressable onPress={() => refetch()} style={[styles.retry, { backgroundColor: theme.primary }]}>
            <Text style={{ color: theme.onPrimary, fontWeight: '700' }}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={
            tab === 'all' && !search ? (
              <View style={{ marginBottom: 12 }}>
                <StatsHeader open={stats.open} overdue={stats.overdue} doneToday={stats.doneToday} theme={theme} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              theme={theme}
              onToggle={() => toggle.mutate({ id: item.id, status: item.status === 'done' ? 'todo' : 'done' })}
              onDelete={() => del.mutate(item.id)}
              onPress={() => router.push(`/task/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={tab === 'done' ? 'trophy-outline' : 'sparkles-outline'}
              title={search ? 'No matches' : tab === 'done' ? 'Nothing completed yet' : 'All clear!'}
              subtitle={
                search ? 'Try a different search.' : tab === 'done' ? 'Finished tasks show up here.' : 'Tap + to add your first task.'
              }
              theme={theme}
            />
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
          }
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/new');
        }}
      >
        <Ionicons name="add" size={30} color={theme.onPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

function endOfToday(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function SkeletonList({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.list}>
      <ActivityIndicator color={theme.primary} style={{ marginBottom: 16 }} />
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.skeleton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  list: { padding: 16, paddingTop: 12, paddingBottom: 120, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center' },
  retry: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  skeleton: { height: 84, borderRadius: 16, borderWidth: 1, marginBottom: 10, opacity: 0.6 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
