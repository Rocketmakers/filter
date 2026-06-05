# filter-builder

Three flavours of the same compound `FilterBuilder` component, each in its own
package. All shadcn-style: copy the source into your app, no library dep.

| Package | Styling stack | Port | Dir |
| --- | --- | --- | --- |
| `@filter-builder/tailwind` | Tailwind v4 + Radix + cmdk | 5173 | [`packages/tailwind`](packages/tailwind) |
| `@filter-builder/mantine` | Mantine v8 + SCSS modules | 5174 | [`packages/mantine`](packages/mantine) |
| `@filter-builder/stylex` | StyleX + Radix + cmdk | 5175 | [`packages/stylex`](packages/stylex) |

Every variant supports six filter types (`text`, `number`, `boolean`, `select`,
`date`, `dateTime`), natural-language date parsing, async option search,
multi-select with auto-condition switching, lockable pills, and a client-side
`useFilteredRows` helper.

## Adding it to your app

Pick the variant whose styling stack matches your app, then:

1. Copy that package's `src/components/ui/filter-builder/` folder into your
   project (preserve the folder; the imports inside it are relative).
2. Copy the sibling primitives in `src/components/ui/` that the folder
   imports from — `popover.tsx`, `dropdown-menu.tsx` / `menu.tsx`, `checkbox.tsx`,
   `command.tsx`, `calendar.tsx`, `label.tsx`, `tooltip.tsx`, `button.tsx`, plus
   the compound `filter.tsx`. The package's own README lists the exact set.
3. Copy the `lib/` helper file(s) (`utils.ts` for Tailwind, `class-names.ts`
   for Mantine, `sx.ts` for StyleX) and the theme/token files (`tokens.stylex.ts`
   + `constants.stylex.ts` for StyleX; `theme/brand.scss` for Mantine).
4. Install the npm dependencies the package's `package.json` lists under
   `dependencies` (Radix, cmdk, chrono-node, date-fns, lucide-react, etc.).
5. Wire any required providers at your app root (`TooltipProvider` for
   Tailwind, `MantineProvider` + `DatesProvider` + `Notifications` for Mantine,
   `ThemeProvider` for StyleX dark mode). Each package's `src/main.tsx` shows
   the exact setup.

If a primitive your copy depends on isn't already in your repo, you'll get a
loud "module not found" error rather than mystery files appearing — that's
intentional, and matches shadcn's "you own your components" philosophy. There's
no `npx shadcn add` registry hooked up yet (that's planned), so for now this is
a copy-paste flow.

## Usage

```tsx
import { useState } from "react";
import {
  FilterBuilder,
  useFilteredRows,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

type Order = {
  id: string;
  customer: { id: string; name: string };
  total: number;
  placedAt: Date;
  paid: boolean;
};

const orderFilters = [
  { name: "customer", label: "Customer", type: "select", /* ... */ },
  { name: "total",    label: "Total",    type: "number" },
  { name: "placedAt", label: "Placed",   type: "date" },
  { name: "paid",     label: "Paid",     type: "boolean" },
];

function OrdersPage({ orders }: { orders: Order[] }) {
  const [filters, setFilters] = useState<FilterBuilderValue[]>([]);
  const filtered = useFilteredRows(orders, filters);

  return (
    <>
      <FilterBuilder
        filters={orderFilters}
        value={filters}
        onChange={setFilters}
      />
      <OrderTable orders={filtered} />
    </>
  );
}
```

The full demo (`src/demo/registry.tsx` in any package) covers all six filter
types, including async select search with custom option renderers, date
shortcuts, and inverse-boolean labels.

## Running the demos

```sh
pnpm install
pnpm dev
```

Launches all three demos in parallel on 5173 / 5174 / 5175. To focus on one:

```sh
pnpm dev:tw       # tailwind on 5173
pnpm dev:mantine  # mantine on 5174
pnpm dev:stylex   # stylex on 5175
```

Each demo's header has a light/dark toggle so you can verify both theme paths.

## Repository conventions

See [CONTRIBUTING.md](CONTRIBUTING.md) for the commit flow (AI-assisted
Conventional Commits via robo-commitizen) and the cross-package AI codemod
that keeps the three variants in sync.
