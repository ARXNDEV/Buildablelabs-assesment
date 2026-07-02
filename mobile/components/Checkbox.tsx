import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import type { Theme } from '../lib/theme';

/** Animated check-off control: springs when toggled, fills when done. */
export function Checkbox({
  done,
  onToggle,
  theme,
}: {
  done: boolean;
  onToggle: () => void;
  theme: Theme;
}) {
  const scale = useSharedValue(1);
  const fill = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    fill.value = withTiming(done ? 1 : 0, { duration: 160 });
  }, [done, fill]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: fill.value > 0.5 ? theme.success : 'transparent',
    borderColor: fill.value > 0.5 ? theme.success : theme.textFaint,
  }));

  return (
    <Pressable
      hitSlop={10}
      onPress={() => {
        scale.value = withSpring(1.25, { damping: 6, stiffness: 260 }, () => {
          scale.value = withSpring(1);
        });
        onToggle();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
    >
      <Animated.View style={[styles.box, animatedStyle]}>
        {done && <Ionicons name="checkmark" size={16} color={theme.onPrimary} />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
