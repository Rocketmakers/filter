import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import * as stylex from "@stylexjs/stylex";

import { darkColors } from "../themes.stylex";

type Theme = "light" | "dark";

type ThemeCtx = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeCtx>({ theme: "light", toggle: () => {} });

const STORAGE_KEY = "filter-builder.theme";

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Pre-compute the dark-theme class once. StyleX's createTheme returns an
// opaque token object; running it through stylex.props yields the className
// that sets all `colors.*` custom properties to their dark values.
const DARK_THEME_CLASSES =
  stylex.props(darkColors).className?.split(" ").filter(Boolean) ?? [];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Apply the theme class to <html> so Radix portals (rendered under <body>,
  // outside the themed wrapper div) also pick up the dark token overrides.
  // useLayoutEffect to avoid a one-frame flash on initial mount.
  useLayoutEffect(() => {
    if (!DARK_THEME_CLASSES.length) return undefined;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add(...DARK_THEME_CLASSES);
      return () => root.classList.remove(...DARK_THEME_CLASSES);
    }
    return undefined;
  }, [theme]);

  const value = useMemo<ThemeCtx>(
    () => ({ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        {...stylex.props(theme === "dark" && darkColors)}
        style={{ minHeight: "100%" }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
