import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'deepfetch_theme';
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {}, setTheme: () => {} });

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore storage errors
  }
  // Fall back to OS preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next === 'light' ? 'light' : 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
