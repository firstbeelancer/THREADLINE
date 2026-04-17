import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  resolvedTheme: 'dark',
});

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  enableSystem = true,
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const resolved =
      theme === 'system' && enableSystem
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme === 'system'
        ? 'dark'
        : theme;
    setResolvedTheme(resolved);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, [theme, enableSystem]);

  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
