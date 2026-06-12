/**
 * UI-agnostic metadata for the integration examples shown on the demo
 * pages: titles, blurbs, groups, and TOC sections. The actual source
 * for each example lives in `./examples/*.ts` — UI packages load those
 * via Vite `?raw` imports to display them as code blocks.
 */

export type ExampleLanguage = "ts" | "tsx" | "sql" | "graphql";

export type ExampleVariant = {
  blurb: string;
  language: ExampleLanguage;
  /** Path the consumer uses with `?raw` to load the source. */
  sourcePath: string;
};

export type IntegrationExample = {
  id: string;
  title: string;
  /** Brand the logo component is keyed by in the UI package. */
  logoKey: string;
  /** Optional one-word badge ("Recommended" / "Beta" / …). */
  badge?: string;
  /**
   * Non-toggleable tile: single blurb + sourcePath + language. Mutually
   * exclusive with `variants`.
   */
  blurb?: string;
  language?: ExampleLanguage;
  sourcePath?: string;
  /**
   * Toggleable tile (used when the group declares toggles). One entry
   * per toggle option id, joined with `-` in declaration order.
   */
  variants?: Record<string, ExampleVariant>;
};

export type GroupToggle = {
  /** Stable id used to construct variant keys. */
  id: string;
  /** Visible label above the toggle. */
  label: string;
  options: { id: string; label: string }[];
  /** Which option is selected on first render. */
  defaultId: string;
};

/** When the group is "enabled" — read against the wizard state. */
export type Gate = Record<string, string[]>;

export type QuestionOption = {
  /** Value written into wizard state when picked. */
  id: string;
  label: string;
  logoKey: string;
  blurb?: string;
  badge?: string;
};

export type QuestionGroup = {
  kind: "question";
  id: string;
  title: string;
  blurb: string;
  /** Wizard state key the picked option writes to. */
  stateKey: string;
  options: QuestionOption[];
  /** Optional — when set, group is visible but disabled until the gate passes. */
  enabledWhen?: Gate;
};

export type TileGroup = {
  kind: "tiles";
  id: string;
  title: string;
  blurb: string;
  toggles?: GroupToggle[];
  examples: IntegrationExample[];
  /** Optional — when set, group is visible but disabled until the gate passes. */
  enabledWhen?: Gate;
};

export type IntegrationGroup = QuestionGroup | TileGroup;

export type TocSection = {
  id: string;
  title: string;
  depth: 1 | 2;
};

function makeClientVariants(
  fileStem: string,
  transportBlurbs: { rest: string; graphql: string },
): Record<string, ExampleVariant> {
  const base = "@filter-builder/demo-code/integrations/examples/send-to-api";
  const SOURCE_TAIL: Record<string, string> = {
    url: " Filters live in the URL. The consumer uses `useFilterParams` so back/forward and bookmarking just work.",
    state:
      " Filters live in component state via `useState`. Pick this when URL sync isn't needed, like modal pickers or dashboard widgets.",
  };
  const variants: Record<string, ExampleVariant> = {};
  for (const format of ["rest", "graphql"] as const) {
    for (const source of ["url", "state"] as const) {
      variants[`${format}-${source}`] = {
        blurb: transportBlurbs[format] + SOURCE_TAIL[source],
        language: "tsx",
        sourcePath: `${base}/${fileStem}-${format}-${source}.tsx`,
      };
    }
  }
  return variants;
}

export const integrationGroups: IntegrationGroup[] = [
  {
    kind: "question",
    id: "question-storage",
    title: "How are you storing the filter state?",
    blurb:
      "The filter builder hands you a `FilterBuilderValue[]`. Where does that array live in your app? Pick `URL` for shareable links and back-button friendliness (the default), `State` for transient widgets, or `Both` to wire one to the other.",
    stateKey: "storage",
    options: [
      {
        id: "url",
        label: "URL",
        logoKey: "storage-url",
        badge: "Recommended",
        blurb:
          "Shareable, bookmarkable, back-button-friendly, SSR-ready. The filter array is encoded as `filter=…` search params.",
      },
      {
        id: "state",
        label: "State",
        logoKey: "storage-state",
        blurb:
          "Filters live in `useState`, Zustand, Redux, MobX, or a React Context. Use this when the filters are transient (modals, popovers, embedded widgets).",
      },
      {
        id: "both",
        label: "Both",
        logoKey: "storage-both",
        blurb:
          "URL drives shareable state but a local store keeps the working draft. Useful when filters can be edited but only applied on a button-click.",
      },
    ],
  },
  {
    kind: "tiles",
    id: "group-url",
    title: "Sync filters with the URL",
    blurb:
      "Pick the variant for your router. The live table above this section uses the Vanilla one.",
    enabledWhen: { storage: ["url", "both"] },
    examples: [
      {
        id: "url-vanilla",
        title: "Vanilla (window.history)",
        blurb:
          "No router dependency. Read with `URLSearchParams`, write with `history.replaceState`, listen for back/forward via `popstate`. This is what the live demo on this page is wired to.",
        language: "ts",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/url/vanilla.ts",
        logoKey: "vanilla",
      },
      {
        id: "url-next-app",
        title: "Next.js (App Router)",
        blurb:
          "`useSearchParams` + `router.replace()` from `next/navigation`. The page is `\"use client\"`, but a server component can pre-parse the URL with the same `parseFilters` helper for SSR.",
        language: "ts",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/url/next-app-router.tsx",
        logoKey: "nextjs",
      },
      {
        id: "url-next-pages",
        title: "Next.js (Pages Router)",
        blurb:
          "`useRouter` from `next/router`. `router.query` is synchronous and `router.replace({ query }, undefined, { shallow: true })` updates the URL without re-running `getServerSideProps`.",
        language: "ts",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/url/next-pages-router.ts",
        logoKey: "nextjs",
      },
      {
        id: "url-tanstack",
        title: "TanStack Router",
        blurb:
          "Schema-driven search params with Zod. `Route.useSearch()` is fully type-safe and `useNavigate({ from: Route })` writes back without re-encoding.",
        language: "tsx",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/url/tanstack.tsx",
        logoKey: "tanstack",
      },
      {
        id: "url-react-router",
        title: "React Router",
        blurb:
          "`useSearchParams()` returns `[searchParams, setSearchParams]`. Pass `{ replace: true }` so every keystroke doesn't pile up history entries.",
        language: "ts",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/url/react-router.ts",
        logoKey: "react-router",
      },
    ],
  },
  {
    kind: "tiles",
    id: "group-state",
    title: "Choose your state manager",
    blurb:
      "How is the filter array exposed to the rest of your app? Pick the store that matches your stack.",
    enabledWhen: { storage: ["state", "both"] },
    examples: [
      {
        id: "state-react-context",
        title: "React Context",
        badge: "Recommended",
        blurb:
          "A `<FilterProvider>` holds the array in `useState` and exposes a `useFilters()` hook. No extra dependency.",
        language: "tsx",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/state/react-context.tsx",
        logoKey: "state-context",
      },
      {
        id: "state-zustand",
        title: "Zustand",
        blurb:
          "Tiny store with selector-based subscriptions. `useFilterStore((s) => s.filters)` only re-renders consumers when the filter array changes.",
        language: "tsx",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/state/zustand.tsx",
        logoKey: "zustand",
      },
      {
        id: "state-redux",
        title: "Redux Toolkit",
        blurb:
          "`createSlice` + `useSelector` / `useDispatch`. Wire the slice into your existing store and dispatch `setFilters(next)` from the `onChange`.",
        language: "tsx",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/state/redux-toolkit.tsx",
        logoKey: "redux",
      },
      {
        id: "state-mobx",
        title: "MobX",
        blurb:
          "An observable class with `makeAutoObservable`. Wrap the consumer in `observer()` and MobX tracks the read of `store.filters` automatically.",
        language: "tsx",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/state/mobx.tsx",
        logoKey: "mobx",
      },
    ],
  },
  {
    kind: "question",
    id: "question-backend",
    title: "Are you sending the filters to a backend?",
    blurb:
      "If yes, you'll wire up an HTTP client and a server-side translator. If no, filter the rows you already have on the client.",
    stateKey: "backend",
    enabledWhen: { storage: ["url", "state", "both"] },
    options: [
      {
        id: "yes",
        label: "Yes",
        logoKey: "backend-yes",
        blurb:
          "There's an API to call. The next two sections show how to pick a client and translate the filter array into a real query.",
      },
      {
        id: "no",
        label: "No",
        logoKey: "backend-no",
        blurb:
          "All the rows are already in the browser. Use the bundled `useFilteredRows` to filter them in place.",
      },
    ],
  },
  {
    kind: "tiles",
    id: "group-transport",
    title: "Send filters to your API",
    blurb:
      "Pick your HTTP client. Toggle the API format and the filter source. Every tile updates to match.",
    enabledWhen: { backend: ["yes"] },
    toggles: [
      {
        id: "format",
        label: "API format",
        options: [
          { id: "rest", label: "REST" },
          { id: "graphql", label: "GraphQL" },
        ],
        defaultId: "rest",
      },
      {
        id: "source",
        label: "Filter source",
        options: [
          { id: "url", label: "URL" },
          { id: "state", label: "State" },
        ],
        defaultId: "url",
      },
    ],
    examples: [
      {
        id: "client-fetch",
        title: "Vanilla (fetch)",
        logoKey: "fetch",
        variants: makeClientVariants("vanilla-fetch", {
          rest: "Browser-native `fetch` with `URLSearchParams`. Re-uses the same serializer the URL-sync hooks use, so deep-linkable filter URLs map straight onto the request.",
          graphql:
            "Browser-native `fetch` POSTing `{ query, variables }` to a single GraphQL endpoint. Errors come back inside `data.errors`.",
        }),
      },
      {
        id: "client-tanstack-query",
        title: "TanStack Query",
        badge: "Recommended",
        logoKey: "tanstack-query",
        variants: makeClientVariants("tanstack-query", {
          rest: "`useQuery` wrapping fetch. The serialized filter array goes into the queryKey, so cache entries are unique per filter combo and toggles trigger automatic refetches.",
          graphql:
            "`useQuery` POSTing a GraphQL operation. The `where` variables are the queryKey, giving you per-filter cache buckets and automatic refetch on change.",
        }),
      },
      {
        id: "client-axios",
        title: "Axios",
        logoKey: "axios",
        variants: makeClientVariants("axios", {
          rest: "`axios.get` with the filters in `params`. Axios handles `URLSearchParams` natively, including `AbortSignal` for in-flight cancellation.",
          graphql:
            "`axios.post` to the GraphQL endpoint. Use `axios.isCancel` to differentiate abort errors from genuine network failures.",
        }),
      },
    ],
  },
  {
    kind: "tiles",
    id: "group-server",
    title: "Run the query on your server",
    blurb:
      "Once the filters arrive, here's how to translate them into a real query for the common Node-side ORMs and clients.",
    enabledWhen: { backend: ["yes"] },
    examples: [
      {
        id: "raw-sql",
        title: "Raw SQL",
        blurb:
          "Parameterised SQL. Never string-concat user input. Pre-validate `f.property` against an allow-list of columns. Array fields use SQLite/Postgres `json_each`; skills go through an `employee_skills` junction.",
        language: "ts",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/raw-sql.ts",
        logoKey: "sql",
      },
      {
        id: "drizzle",
        title: "Drizzle",
        blurb:
          "Type-safe SQL query builder. Each operator is a function that returns an `SQL` fragment, composed with `and(...)`. Plural-value variants drop into raw `sql\`\`` for the `json_each` / `EXISTS` subqueries.",
        language: "ts",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/drizzle.ts",
        logoKey: "drizzle",
      },
      {
        id: "kysely",
        title: "Kysely",
        blurb:
          "Type-safe SQL builder that stays closer to raw SQL than Drizzle. Returns an expression you hand to `.where()`. Plural-value variants reach for `sql\`json_each(...)\`` template literals.",
        language: "ts",
        sourcePath: "@filter-builder/demo-code/integrations/examples/kysely.ts",
        logoKey: "kysely",
      },
      {
        id: "prisma",
        title: "Prisma",
        blurb:
          "Build a typed `Prisma.EmployeeWhereInput` and let Prisma generate the SQL. The Postgres provider unlocks `mode: 'insensitive'` and the scalar-array operators (`has`, `hasEvery`, `hasSome`); skills go through `some` / `every` / `none` on the many-to-many relation.",
        language: "ts",
        sourcePath: "@filter-builder/demo-code/integrations/examples/prisma.ts",
        logoKey: "prisma",
      },
      {
        id: "mongoose",
        title: "Mongoose / MongoDB",
        blurb:
          "MongoDB's query DSL is itself a JSON object. Translate each filter into a `$`-prefixed operator and feed it to `find()`. The same operators (`$gt`, `$in`, `$elemMatch`) work for scalar and array fields, keeping the plural-value variants clean.",
        language: "ts",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/mongoose.ts",
        logoKey: "mongo",
      },
      {
        id: "elasticsearch",
        title: "Elasticsearch",
        blurb:
          "Different paradigm. A `bool` query with `must` / `must_not` / `filter` clauses. Use `match` for text and `range` for numbers and dates. ES treats scalar and array fields identically, so the plural-value variants reduce to the same primitives.",
        language: "ts",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/elasticsearch.ts",
        logoKey: "elasticsearch",
      },
    ],
  },
  {
    kind: "tiles",
    id: "group-in-memory",
    title: "Filter in memory (frontend only)",
    blurb:
      "When your rows are already loaded on the client and you just want the UI to filter them.",
    enabledWhen: { backend: ["no"] },
    examples: [
      {
        id: "in-memory",
        title: "TS / in-memory",
        blurb:
          "If all your rows are already loaded client-side, skip the backend entirely. The library ships an in-memory filter that mirrors every condition the UI offers.",
        language: "tsx",
        sourcePath:
          "@filter-builder/demo-code/integrations/examples/in-memory.tsx",
        logoKey: "ts",
      },
    ],
  },
];

export const tocSections: TocSection[] = [
  { id: "demo", title: "Demo", depth: 1 },
  ...integrationGroups.map(
    (g): TocSection => ({ id: g.id, title: g.title, depth: 1 }),
  ),
];
