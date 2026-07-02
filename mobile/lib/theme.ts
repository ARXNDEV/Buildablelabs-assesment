import { useColorScheme } from 'react-native';
import type { TaskPriority } from './types';

/**
 * A tiny design-token system. Light + dark palettes with the same shape, so
 * components just read `theme.<token>` and automatically adapt.
 */
export interface Theme {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  shadow: string;
}

const light: Theme = {
  dark: false,
  bg: '#f4f5f7',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  border: '#e6e8ec',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  primary: '#6366f1',
  primarySoft: '#eef2ff',
  onPrimary: '#ffffff',
  danger: '#ef4444',
  dangerSoft: '#fef2f2',
  success: '#10b981',
  successSoft: '#ecfdf5',
  warning: '#f59e0b',
  shadow: '#0f172a',
};

const dark: Theme = {
  dark: true,
  bg: '#0b0f17',
  surface: '#151b26',
  surfaceAlt: '#1c2432',
  border: '#26303f',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textFaint: '#64748b',
  primary: '#818cf8',
  primarySoft: '#1e2333',
  onPrimary: '#0b0f17',
  danger: '#f87171',
  dangerSoft: '#2a1a1d',
  success: '#34d399',
  successSoft: '#10231d',
  warning: '#fbbf24',
  shadow: '#000000',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Priority accent colors keyed to the active theme. */
export function priorityColor(priority: TaskPriority, theme: Theme): string {
  switch (priority) {
    case 'high':
      return theme.danger;
    case 'medium':
      return theme.warning;
    case 'low':
      return theme.success;
  }
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
