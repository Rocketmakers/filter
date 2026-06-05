# filter-builder

Three flavours of the same compound `FilterBuilder` component, each in its own
package. Copy the source into your app — no library dependency, no runtime
wrapper.

| Package | Styling stack | Install path | Port | Dir |
| --- | --- | --- | --- | --- |
| `@filter-builder/tailwind` | Tailwind v4 + Radix + cmdk | `shadcn` registry | 5173 | [`packages/tailwind`](packages/tailwind) |
| `@filter-builder/mantine` | Mantine v8 + SCSS modules | `@rocketmakers/filter` CLI | 5174 | [`packages/mantine`](packages/mantine) |
| `@filter-builder/stylex` | StyleX + Radix + cmdk | `@rocketmakers/filter` CLI | 5175 | [`packages/stylex`](packages/stylex) |

Every variant supports six filter types (`text`, `number`, `boolean`, `select`,
`date`, `dateTime`), natural-language date parsing, async option search,
multi-select with auto-condition switching, lockable pills, and a client-side
`useFilteredRows` helper.

## Adding it to your app

### Tailwind — shadcn registry

The Tailwind variant ships as a [shadcn](https://ui.shadcn.com) registry block,
so it slots into any shadcn-configured project:

```sh
npx shadcn@latest add https://rocketmakers.github.io/filter/r/filter-builder-tailwind.json
```

The shadcn CLI handles dependencies, file targets, and `components.json` for
you. After it runs, wrap your app in `TooltipProvider` (from
`@/components/ui/tooltip`) and mount `<Toaster />` from `sonner`. See
[`packages/tailwind/src/main.tsx`](packages/tailwind/src/main.tsx) for the
exact setup.

### Mantine / StyleX — `@rocketmakers/filter` CLI

The Mantine and StyleX variants don't assume any shadcn config — they ship
through a one-shot installer:

```sh
npx @rocketmakers/filter mantine
# or
npx @rocketmakers/filter stylex
```

The CLI drops the source under `src/`, installs the npm dependencies with
whichever package manager your project uses (pnpm / yarn / bun / npm), and
prints the provider-wiring snippet for the variant. Run with `--help` to see
all options (`--cwd`, `--force`, `--no-install`).

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
