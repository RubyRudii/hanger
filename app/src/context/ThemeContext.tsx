import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { DARK, LIGHT, Palette } from '@/lib/theme';

type Mode = 'light' | 'dark';

type ThemeState = {
  mode: Mode;
  colors: Palette;
  setMode: (m: Mode) => void;
  toggle: () => void;
};

const KEY = '@hanger/theme';
const ThemeCtx = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'light' || v === 'dark') setModeState(v);
    });
  }, []);

  function setMode(m: Mode) {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  }

  function toggle() {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }

  const colors = mode === 'light' ? LIGHT : DARK;

  return <ThemeCtx.Provider value={{ mode, colors, setMode, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
