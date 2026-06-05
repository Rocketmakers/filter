/**
 * Non-themed design tokens. `defineConsts` compiles to inlined values (no
 * `var(--x)` indirection at runtime), which is the right fit for spacing,
 * radii, type scale, etc. that never change between themes.
 *
 * Themed values (colours) live in `tokens.stylex.ts` as `defineVars` so the
 * dark theme in `themes.stylex.ts` can override them.
 */
import * as stylex from "@stylexjs/stylex";

export const spacing = stylex.defineConsts({
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
});

export const radii = stylex.defineConsts({
  sm: "0.125rem",
  md: "0.375rem",
  lg: "0.5rem",
  full: "9999px",
});

export const text = stylex.defineConsts({
  xs: "0.75rem",
  sm: "0.875rem",
  md: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
});

export const shadows = stylex.defineConsts({
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
});
