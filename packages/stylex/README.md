# @filter-builder/stylex

Meta's StyleX styling layer over the same Radix + cmdk + react-day-picker
headless primitives used by the Tailwind variant.

```sh
pnpm install
pnpm dev   # http://localhost:5175
```

## What's in the box

```
src/
├── tokens.stylex.ts          # defineVars: colors, spacing, radii, text, shadows
├── themes.stylex.ts          # darkColors = createTheme(colors, { ... })
├── lib/
│   ├── sx.ts                 # stylex.props + className merge helper
│   └── theme.tsx             # <ThemeProvider> applies darkColors on toggle
├── components/ui/
│   ├── filter-builder/       # logic + UI (identical structure to other variants)
│   ├── filter.tsx
│   ├── button.tsx            # variant/size styles in stylex.create
│   ├── popover.tsx           # Radix Popover, StyleX-styled
│   ├── dropdown-menu.tsx     # Radix DropdownMenu, StyleX-styled
│   ├── checkbox.tsx
│   ├── tooltip.tsx
│   ├── label.tsx
│   ├── calendar.tsx          # react-day-picker, StyleX-styled
│   └── command.tsx           # cmdk wrappers, StyleX-styled
├── index.css                 # element resets + StyleX build target
└── main.tsx
```

## Tokens

All visual values live in `tokens.stylex.ts` as `stylex.defineVars` exports.
These are the **only** colour/spacing/radii sources in the package — there are
no hardcoded hex codes inside component files.

```ts
// tokens.stylex.ts (excerpt)
export const colors = stylex.defineVars({
  background: "#ffffff",
  foreground: "#0a0a0a",
  /* ... */
});
```

The dark theme in `themes.stylex.ts` overrides those vars via
`stylex.createTheme`. `lib/theme.tsx` applies it to a wrapper `<div>` when the
user toggles — that's the standard StyleX pattern for runtime themes.

## Port pattern

Each Tailwind className string from the original component became a
`stylex.create({ ... })` block in the same file. Conditional / variant styles
use array-form composition:

```tsx
const styles = stylex.create({
  segment: { display: "inline-flex", ... },
  segmentOpen: { backgroundColor: colors.accent },
});

<button {...stylex.props(styles.segment, open && styles.segmentOpen)} />
```

Radix's `data-state="open"` attribute is read via the StyleX `:is(...)` selector
key, e.g. `':is([data-state="open"])': colors.accent`.

For consumer-provided `className` props, `sx(...)` (in `lib/sx.ts`) merges the
StyleX-generated class with the external string.

## Why we kept Radix + cmdk

Tailwind was purely the *styling* layer in the original — the keyboard
navigation, popovers, dropdowns, and tooltips all came from headless libraries.
Swapping those would touch behaviour, not visuals; this package focuses the
diff on the styling layer only.

## Installing into a consuming app

One command in your project root:

```sh
npx @rocketmakers/filter stylex
```

The [`@rocketmakers/filter`](../cli) CLI drops `src/components/ui/`,
`src/lib/`, `src/tokens.stylex.ts`, and `src/themes.stylex.ts` into your app,
then installs the runtime + dev dependencies with whichever package manager
your project uses. After it runs, wrap your app in `<ThemeProvider>` (from
`./lib/theme`) and wire `@stylexjs/unplugin` into your bundler **before**
`@vitejs/plugin-react` to preserve Fast Refresh:

```ts
import stylex from "@stylexjs/unplugin";
export default defineConfig({
  plugins: [
    stylex.vite({ useCSSLayers: true }),
    react(),
  ],
});
```

See [`src/main.tsx`](src/main.tsx) for the exact provider setup.

### Manual install (no CLI)

If you'd rather skip the CLI, copy the files listed under `files` in
`https://rocketmakers.github.io/filter/r/filter-builder-stylex.json` and
install these deps yourself:

```sh
pnpm add @stylexjs/stylex @radix-ui/react-popover @radix-ui/react-dropdown-menu \
         @radix-ui/react-tooltip @radix-ui/react-checkbox @radix-ui/react-label \
         @radix-ui/react-slot @radix-ui/react-context @radix-ui/react-dialog \
         cmdk chrono-node date-fns react-day-picker lucide-react sonner lodash
pnpm add -D @stylexjs/unplugin
```
