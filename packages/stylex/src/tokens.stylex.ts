/**
 * Themed tokens — only what the dark theme actually overrides goes here.
 * Everything else (spacing, radii, type scale, shadows) is static and lives
 * in `constants.stylex.ts` as `defineConsts`, so we don't pay the runtime
 * cost of `--var` lookups for values that never change.
 *
 * Rules StyleX enforces on this file:
 * - File extension must be `.stylex.ts`.
 * - Only `defineVars` calls allowed; only named exports; nothing else.
 */
import * as stylex from "@stylexjs/stylex";

export const colors = stylex.defineVars({
  background: "#ffffff",
  foreground: "#0a0a0a",
  card: "#ffffff",
  cardForeground: "#0a0a0a",
  popover: "#ffffff",
  popoverForeground: "#0a0a0a",
  primary: "#171717",
  primaryForeground: "#fafafa",
  muted: "#f5f5f5",
  mutedForeground: "#737373",
  // Slightly darker than `muted` so hover/focus is actually visible in light
  // mode. The Tailwind variant inherits shadcn's identical-in-light-mode
  // palette and ends up with no visible hover delta — we can do better.
  accent: "#ebebeb",
  accentForeground: "#0a0a0a",
  border: "#e5e5e5",
  input: "#e5e5e5",
  ring: "rgba(64, 64, 64, 0.5)",
  destructive: "#ef4444",
  destructiveForeground: "#fafafa",
});
