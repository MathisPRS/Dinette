import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'rose' | 'black' | 'red' | 'purple' | 'green' | 'blue' | 'orange';

export interface ThemePalette {
  id: ThemeId;
  swatch: string; // representative color for the UI swatch
  vars: Record<string, string>; // CSS variable values (--brand-50 … --brand-900)
}

export const THEMES: ThemePalette[] = [
  {
    id: 'rose',
    swatch: '#ff8da1',
    vars: {
      '--brand-50': '#fff0f3',
      '--brand-100': '#ffe0e7',
      '--brand-200': '#ffc2d0',
      '--brand-300': '#ff8da1',
      '--brand-400': '#ff6b85',
      '--brand-500': '#ff8da1',
      '--brand-600': '#e8708a',
      '--brand-700': '#c45470',
      '--brand-800': '#9e3d57',
      '--brand-900': '#7a2d42',
    },
  },
  {
    id: 'orange',
    swatch: '#f97316',
    vars: {
      '--brand-50': '#fff7ed',
      '--brand-100': '#ffedd5',
      '--brand-200': '#fed7aa',
      '--brand-300': '#fdba74',
      '--brand-400': '#fb923c',
      '--brand-500': '#f97316',
      '--brand-600': '#ea6c10',
      '--brand-700': '#c2560b',
      '--brand-800': '#9a4009',
      '--brand-900': '#7c3a09',
    },
  },
  {
    id: 'red',
    swatch: '#ef4444',
    vars: {
      '--brand-50': '#fef2f2',
      '--brand-100': '#fee2e2',
      '--brand-200': '#fecaca',
      '--brand-300': '#fca5a5',
      '--brand-400': '#f87171',
      '--brand-500': '#ef4444',
      '--brand-600': '#dc2626',
      '--brand-700': '#b91c1c',
      '--brand-800': '#991b1b',
      '--brand-900': '#7f1d1d',
    },
  },
  {
    id: 'purple',
    swatch: '#8b5cf6',
    vars: {
      '--brand-50': '#f5f3ff',
      '--brand-100': '#ede9fe',
      '--brand-200': '#ddd6fe',
      '--brand-300': '#c4b5fd',
      '--brand-400': '#a78bfa',
      '--brand-500': '#8b5cf6',
      '--brand-600': '#7c3aed',
      '--brand-700': '#6d28d9',
      '--brand-800': '#5b21b6',
      '--brand-900': '#4c1d95',
    },
  },
  {
    id: 'blue',
    swatch: '#3b82f6',
    vars: {
      '--brand-50': '#eff6ff',
      '--brand-100': '#dbeafe',
      '--brand-200': '#bfdbfe',
      '--brand-300': '#93c5fd',
      '--brand-400': '#60a5fa',
      '--brand-500': '#3b82f6',
      '--brand-600': '#2563eb',
      '--brand-700': '#1d4ed8',
      '--brand-800': '#1e40af',
      '--brand-900': '#1e3a8a',
    },
  },
  {
    id: 'green',
    swatch: '#10b981',
    vars: {
      '--brand-50': '#ecfdf5',
      '--brand-100': '#d1fae5',
      '--brand-200': '#a7f3d0',
      '--brand-300': '#6ee7b7',
      '--brand-400': '#34d399',
      '--brand-500': '#10b981',
      '--brand-600': '#059669',
      '--brand-700': '#047857',
      '--brand-800': '#065f46',
      '--brand-900': '#064e3b',
    },
  },
  {
    id: 'black',
    swatch: '#374151',
    vars: {
      '--brand-50': '#f9fafb',
      '--brand-100': '#f3f4f6',
      '--brand-200': '#e5e7eb',
      '--brand-300': '#d1d5db',
      '--brand-400': '#9ca3af',
      '--brand-500': '#6b7280',
      '--brand-600': '#4b5563',
      '--brand-700': '#374151',
      '--brand-800': '#1f2937',
      '--brand-900': '#111827',
    },
  },
];

interface ThemeState {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: 'rose',
      setTheme: (id) => set({ themeId: id }),
    }),
    {
      name: 'dinette-theme',
    }
  )
);

export function applyTheme(themeId: ThemeId) {
  const palette = THEMES.find((t) => t.id === themeId);
  if (!palette) return;
  const root = document.documentElement;
  Object.entries(palette.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
