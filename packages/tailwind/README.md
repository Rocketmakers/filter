# filter-builder

Filter builder for React + Tailwind + Radix.

Generic over the row type, supports six data types (`text`, `number`, `boolean`,
`select`, `date`, `dateTime`), natural-language date parsing via `chrono-node`,
async option search, multi-select with auto-condition switching, lockable pills,
and a client-side `useFilteredRows` helper.

This repo is both the **dev playground** for the component and the **source you
copy** into a consuming app — there's no published package. Drop the
`src/components/ui/filter-builder/` folder (plus a few shadcn primitives) into
your project and you're done.

## Running the playground

```sh
npm install
npm run dev
```

Open <http://localhost:5173>. The demo filters 15 mock employees across all
six filter types.

## What's in the box

```
src/components/ui/filter-builder/
├── filter-builder.tsx     # main controlled component
├── add-button.tsx         # "+ Filter" trigger
├── command.tsx            # filter-picker popover (cmdk)
├── box.tsx                # one pill: property · condition · value · x
├── context.ts             # internal Radix-style context
├── types.ts               # all public types + condition registries
├── utils.tsx              # renderer dispatch + condition-validity logic
├── apply-filter.ts        # client-side filterRows / useFilteredRows
├── index.ts               # public exports
└── renderers/
    ├── text.tsx
    ├── number.tsx
    ├── boolean.tsx
    ├── select.tsx
    ├── date.tsx           # calendar + chrono-node natural language
    └── date-time.tsx      # calendar + time input + chrono-node
```

## Installing into a consuming app

The fastest path is the published shadcn registry:

```sh
npx shadcn@latest add https://rocketmakers.github.io/filter/r/filter-builder-tailwind.json
```

That drops every file listed below and installs the runtime dependencies in
one shot. The sections that follow describe the same thing if you'd rather
copy by hand.

### 1. Required shadcn primitives

The filter-builder consumes these shadcn-style primitives from
`@/components/ui/`. Install them via the shadcn CLI **or** copy from this
repo's `src/components/ui/`:

- `button.tsx`
- `command.tsx`
- `popover.tsx`
- `dropdown-menu.tsx`
- `checkbox.tsx`
- `label.tsx`
- `calendar.tsx` (a thin wrapper over `react-day-picker`)
- `tooltip.tsx`
- `filter.tsx` (the compound visual primitive — copy as-is from this repo)

You also need `src/lib/utils.ts` exporting the standard `cn(...)` helper.

### 2. Runtime dependencies

```sh
npm install @radix-ui/react-popover @radix-ui/react-dropdown-menu \
            @radix-ui/react-tooltip @radix-ui/react-checkbox \
            @radix-ui/react-label @radix-ui/react-slot \
            @radix-ui/react-context @radix-ui/react-dialog \
            cmdk chrono-node date-fns react-day-picker lucide-react \
            clsx tailwind-merge class-variance-authority lodash sonner
```

`sonner` is only used by the number renderer to show a "please enter a valid
number" toast. If you'd rather use your own toast, replace the one import in
`renderers/number.tsx`.

### 3. Tailwind

Tailwind v4 is used here, but the filter-builder itself uses only standard
utility classes (`bg-popover`, `text-foreground`, `border-input`, etc.). Any
shadcn-themed app should drop in without changes.

### 4. Mount a `TooltipProvider`

The "remove filter" button uses a tooltip. Add a `TooltipProvider` somewhere
above the `FilterBuilder` (typically at your app root).

## Usage

```tsx
import { useState } from "react";
import {
  FilterBuilder,
  useFilteredRows,
  type FilterBuilderValue,
  type FilterOptionRegistry,
} from "@/components/ui/filter-builder";

type Order = {
  id: string;
  customer: { id: string; name: string };
  total: number;
  placedAt: Date;
  paid: boolean;
};

const orderFilters: FilterOptionRegistry = [
  { name: "customer", label: "Customer", type: "select" /* ... */ },
  { name: "total", label: "Total", type: "number" },
  { name: "placedAt", label: "Placed", type: "date" },
  { name: "paid", label: "Paid", type: "boolean" },
];

function OrdersPage({ orders }: { orders: Order[] }) {
  const [filters, setFilters] = useState<FilterBuilderValue[]>([]);
  const filtered = useFilteredRows(orders, filters);

  return (
    <>
      <FilterBuilder
        id="orders-filter"
        filters={orderFilters}
        value={filters}
        onChange={setFilters}
      />
      <OrderTable orders={filtered} />
    </>
  );
}
```

See `src/demo/registry.tsx` for a full registry covering every filter type,
including async select search, `multipleValues` for array-of-tag fields, date
shortcuts, and inverse boolean labels.

## Filter config — every type

### text

```ts
{ name: "title", label: "Title", type: "text" }
```

Conditions: `contains`, `does not contain`. The user can also supply
`customOptions` for predefined string suggestions.

### number

```ts
{ name: "salary", label: "Salary", type: "number", minNumber: 0 }
```

Conditions: `is`, `is greater than`, `is less than`.

### boolean

```ts
{
  name: "deactivated",
  label: "Status",
  type: "boolean",
  context: { isInverse: true, trueValueLabel: "Active", falseValueLabel: "Inactive" },
}
```

`isInverse: true` flips the semantics of true/false — handy for negative-sense
properties like `deactivated`.

### select

```ts
{
  name: "department",
  label: "Department",
  type: "select",
  multiple: true,
  filterSearch: async (term) => api.searchDepartments(term),
  mapToFilterOption: (dept) => ({ id: dept.id, label: dept.name, value: dept }),
  filterOptionRenderer: (opt) => <span>{opt.label}</span>,
  filterSingleOptionRenderer: ([v]) => <Badge>{v.label}</Badge>,
  filterMultipleOptionRenderer: (vs) => <Badge>+{vs.length}</Badge>,
}
```

Set `multipleValues: true` when the row's property is itself an array
(e.g. `tags: string[]`) — this changes the conditions from `is one of` to
`has one of` / `has all`.

### date

```ts
{
  name: "hireDate",
  label: "Hire date",
  type: "date",
  formatDate: (d) => format(d, "PP"),
  customOptions: [
    { id: "today", label: "Today", value: new Date() },
    /* ... */
  ],
}
```

Renderer shows a left panel (shortcuts + natural-language preview) and a right
panel (calendar). The user can type `tomorrow`, `in three months`, `1/1/2025`,
etc. Locale is detected via `navigator.language` (en-GB vs en-US).

### dateTime

Same as `date` but with a time input below the calendar. Conditions are
distinct (`DateTimeFilterConditions`) so they can't be mixed up in the
condition dropdown.

## Customizing pills

Per-pill flags in `FilterBuilderValue`:

- `locked: true` — replaces the X with a lock icon; the user cannot remove it.
- `lockedCondition: true` — disables the condition dropdown.

Useful for system-set filters (e.g. a global search term that's not user-removable).

## What was changed from the source

This was extracted from two internal components and improved:

- **Stronger types** — removed `any` from public surface; tightened generics
  with `unknown` internally and `TOption` at the boundary.
- **Proper `dateTime` renderer** — original implementations routed `dateTime`
  through the date renderer with no time input. This repo adds a real
  `date-time.tsx` with a `<input type="time">` below the calendar.
- **Decoupled `Filter` visual primitive** — no longer reaches into the
  filter-builder context; takes a `hasFilters` prop instead. Easier to test
  and reuse.
- **Stripped logging** — original had `console.log` calls in the hot path.
- **Sonner instead of a bespoke toast** — one less dep to pull in.
- **Fixed bug** — original imported `Label` from `recharts` in the box.

## License

MIT.
