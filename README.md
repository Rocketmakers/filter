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

The fastest path is the shadcn CLI — the repo publishes a registry to GitHub
Pages on every release. Pick the variant whose styling stack matches yours:

```sh
npx shadcn@latest add https://rocketmakers.github.io/filter/r/filter-builder-tailwind.json
# or
npx shadcn@latest add https://rocketmakers.github.io/filter/r/filter-builder-mantine.json
# or
npx shadcn@latest add https://rocketmakers.github.io/filter/r/filter-builder-stylex.json
```

That drops the `filter-builder/` compound, the sibling primitives it needs,
the `lib/` helpers, and (for Mantine/StyleX) the theme/token files into the
paths configured in your `components.json`. Then install the npm dependencies
the CLI prints and wire the required providers at your app root
(`TooltipProvider` for Tailwind; `MantineProvider` + `DatesProvider` +
`Notifications` for Mantine; the StyleX `ThemeProvider` for dark mode). Each
package's `src/main.tsx` in this repo shows the exact setup.

### Manual copy-paste (no CLI)

If you'd rather not run the CLI, the registry is just JSON — open one of the
URLs above and the `files` array tells you exactly which files to copy and
where they should land. Same effect, more typing.

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
