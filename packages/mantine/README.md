# @filter-builder/mantine

Mantine v8 + SCSS modules variant of the shadcn-style filter builder.

```sh
pnpm install
pnpm dev   # http://localhost:5174
```

## What's in the box

```
src/components/ui/
├── filter-builder/        # logic + UI (identical structure to other variants)
│   ├── filter-builder.tsx
│   ├── add-button.tsx
│   ├── command.tsx
│   ├── box.tsx
│   ├── context.ts
│   ├── types.ts
│   ├── utils.tsx
│   ├── apply-filter.ts
│   ├── index.ts
│   └── renderers/         # text · number · boolean · select · date · dateTime
├── filter.tsx + .module.scss     # compound visual primitive
├── button.tsx                    # Mantine Button wrapper
├── popover.tsx                   # re-exports Mantine Popover
├── menu.tsx                      # re-exports Mantine Menu (was: dropdown-menu)
├── tooltip.tsx                   # re-exports Mantine Tooltip
├── checkbox.tsx                  # re-exports Mantine Checkbox
├── calendar.tsx                  # @mantine/dates Calendar wrapper
├── label.tsx + .module.scss
└── command.tsx + .module.scss    # cmdk wrappers with .module.scss styling
```

## Visual stack

- **Mantine v8** primitives for Popover, Menu, Tooltip, Checkbox, Button, Calendar
  (`@mantine/core` + `@mantine/dates`).
- **@mantine/notifications** in place of `sonner`.
- **.module.scss** files paired with each `.tsx`. Every colour and spacing reads
  from CSS custom properties defined in `src/theme/brand.scss`. Dark mode is
  driven by `:root[data-mantine-color-scheme="dark"]` — Mantine sets the attribute
  automatically when `useMantineColorScheme().toggleColorScheme()` runs.
- **lucide-react** icons (swap freely — the source is yours).

## What we did NOT swap

We kept **cmdk** for the command-palette keyboard navigation and case-insensitive
substring filtering of items by their `value` prop. Mantine's `Combobox` ships
neither of those for free and replicating them on top of `Combobox` adds enough
code to make the port hard to audit. The cmdk slots
(`Command`, `CommandInput`, `CommandList`, `CommandItem`, `CommandGroup`,
`CommandSeparator`, `CommandEmpty`) are wrapped in `command.tsx` and styled with
`command.module.scss` referencing the same `--fb-*` CSS custom properties as the
rest of the package, so visually it sits inside a Mantine `Popover.Dropdown` and
matches the design system.

If you want a true `Combobox`-only build, fork `command.tsx` — that's the only
file touching cmdk.

## Installing into a consuming app

One command in your project root:

```sh
npx @rocketmakers/filter mantine
```

The [`@rocketmakers/filter`](../cli) CLI drops `src/components/ui/filter-builder/`,
the Mantine primitives, `src/lib/class-names.ts`, and the `src/theme/` SCSS
into your app, then installs the runtime + dev dependencies with whichever
package manager your project uses. After it runs, wire `MantineProvider`,
`DatesProvider`, and `<Notifications />` at your app root and import the CSS:

```ts
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./theme/globals.scss";  // imports brand.scss
```

See [`src/main.tsx`](src/main.tsx) for the exact provider setup.

### Manual install (no CLI)

If you'd rather skip the CLI, copy the files listed under `files` in
`https://rocketmakers.github.io/filter/r/filter-builder-mantine.json` and
install these deps yourself:

```sh
pnpm add @mantine/core @mantine/dates @mantine/hooks @mantine/notifications \
         @radix-ui/react-context cmdk chrono-node date-fns lodash lucide-react
pnpm add -D @types/lodash sass postcss postcss-preset-mantine postcss-simple-vars
```
