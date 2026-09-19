import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

/**
 * TalkChat Theme Management Store (Zustand).
 * 
 * Synchronizes user preference across localStorage and the DOM `dark` class.
 * Supports explicit Light/Dark selection or automatic OS system preference.
 * 
 * @see https://github.com/pmndrs/zustand
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'dark',

  setTheme: (theme: ThemeMode) => {
    localStorage.setItem('talkchat-theme', theme);
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;

    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    set({ theme, resolvedTheme: resolved });
  },

  toggleTheme: () => {
    const current = get().resolvedTheme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initTheme: () => {
    if (typeof window === 'undefined') return;

    const saved = (localStorage.getItem('talkchat-theme') as ThemeMode) || 'system';
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = saved === 'system' ? (isSystemDark ? 'dark' : 'light') : saved;

    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    set({ theme: saved, resolvedTheme: resolved });

    // Listen to OS theme changes if in 'system' mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (get().theme === 'system') {
        const autoResolved = e.matches ? 'dark' : 'light';
        if (autoResolved === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ resolvedTheme: autoResolved });
      }
    });
  },
}));
