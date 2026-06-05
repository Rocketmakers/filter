import * as stylex from "@stylexjs/stylex";

import { colors } from "./tokens.stylex";

/**
 * Dark theme override. Apply via `stylex.props(darkColors)` on any wrapper
 * element — children read the overridden values. See `src/lib/theme.tsx`
 * for the demo wiring.
 */
export const darkColors = stylex.createTheme(colors, {
  background: "#0a0a0a",
  foreground: "#fafafa",
  card: "#171717",
  cardForeground: "#fafafa",
  popover: "#171717",
  popoverForeground: "#fafafa",
  primary: "#fafafa",
  primaryForeground: "#171717",
  muted: "#262626",
  mutedForeground: "#a3a3a3",
  accent: "#262626",
  accentForeground: "#fafafa",
  border: "rgba(255, 255, 255, 0.1)",
  input: "rgba(255, 255, 255, 0.15)",
  ring: "rgba(229, 229, 229, 0.5)",
  destructive: "#ef4444",
  destructiveForeground: "#fafafa",
});
