import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '../lib/theme';

export function SearchBar({
  value,
  onChange,
  theme,
}: {
  value: string;
  onChange: (t: string) => void;
  theme: Theme;
}) {
  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Ionicons name="search" size={17} color={theme.textFaint} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder="Search tasks…"
        placeholderTextColor={theme.textFaint}
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable hitSlop={8} onPress={() => onChange('')}>
          <Ionicons name="close-circle" size={17} color={theme.textFaint} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15 },
});
