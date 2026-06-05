import type { ReactNode } from "react";

/**
 * Data types the filter-builder understands. Each filter config picks one of
 * these via its `type` discriminator. The data type also drives which set of
 * conditions (`is`, `is not`, `contains`, etc.) the user can pick from.
 */
export type FilterDataType =
  | "text"
  | "select"
  | "date"
  | "dateTime"
  | "number"
  | "boolean";

export type FilterCondition = {
  /** Stable identifier — used for equality checks and serialization. */
  type: string;
  /** Human-readable label shown in the condition dropdown. */
  label: string;
  /** Which data type this condition applies to. */
  dataType: FilterDataType;
  /** Polarity. `true` = positive (is, contains), `false` = negative (is not, missing). */
  positive?: boolean;
  /** Optional icon shown next to the condition label. */
  icon?: ReactNode;
  /**
   * Whether the condition expects multiple values selected.
   * `"bothMultipleAndSingle"` means the condition is valid in either case.
   */
  multiple?: boolean | "bothMultipleAndSingle";
  /**
   * Only meaningful for `select` filters. `true` indicates the underlying
   * property on the row is itself an array (e.g. `tags: string[]`), and the
   * condition should perform a CONTAINS-style match rather than IN.
   */
  multipleValues?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Condition registries
// ─────────────────────────────────────────────────────────────────────────────

export const TextFilterConditions = {
  CONTAINS: {
    type: "contains",
    label: "contains",
    dataType: "text",
    positive: true,
    multiple: false,
  },
  NOT_CONTAINS: {
    type: "notContains",
    label: "does not contain",
    dataType: "text",
    positive: false,
    multiple: false,
  },
} as const satisfies Record<string, FilterCondition>;

export const ObjectFilterConditions = {
  EQUALS: {
    type: "equals",
    label: "is",
    dataType: "select",
    positive: true,
    multiple: false,
  },
  NOT_EQUALS: {
    type: "notEquals",
    label: "is not",
    dataType: "select",
    positive: false,
    multiple: false,
  },
  ANY_OF: {
    type: "anyOf",
    label: "is one of",
    dataType: "select",
    positive: true,
    multiple: true,
  },
  NONE_OF: {
    type: "noneOf",
    label: "is not one of",
    dataType: "select",
    positive: false,
    multiple: true,
  },
  INCLUDES: {
    type: "includes",
    label: "has one of",
    dataType: "select",
    positive: true,
    multiple: "bothMultipleAndSingle",
    multipleValues: true,
  },
  INCLUDES_ALL: {
    type: "includesAll",
    label: "has all",
    dataType: "select",
    positive: true,
    multiple: true,
    multipleValues: true,
  },
  EXCLUDES: {
    type: "excludes",
    label: "missing one of",
    dataType: "select",
    positive: false,
    multiple: "bothMultipleAndSingle",
    multipleValues: true,
  },
  EXCLUDES_ALL: {
    type: "excludesAll",
    label: "missing all",
    dataType: "select",
    positive: false,
    multiple: true,
    multipleValues: true,
  },
} as const satisfies Record<string, FilterCondition>;

export const DateFilterConditions = {
  EQUALS: {
    type: "equals",
    label: "is",
    dataType: "date",
    positive: true,
    multiple: false,
  },
  BEFORE: {
    type: "before",
    label: "is before",
    dataType: "date",
    positive: true,
    multiple: false,
  },
  AFTER: {
    type: "after",
    label: "is after",
    dataType: "date",
    positive: true,
    multiple: false,
  },
} as const satisfies Record<string, FilterCondition>;

export const DateTimeFilterConditions = {
  EQUALS: {
    type: "equals",
    label: "is",
    dataType: "dateTime",
    positive: true,
    multiple: false,
  },
  BEFORE: {
    type: "before",
    label: "is before",
    dataType: "dateTime",
    positive: true,
    multiple: false,
  },
  AFTER: {
    type: "after",
    label: "is after",
    dataType: "dateTime",
    positive: true,
    multiple: false,
  },
} as const satisfies Record<string, FilterCondition>;

export const NumberFilterConditions = {
  EQUALS: {
    type: "equals",
    label: "is",
    dataType: "number",
    positive: true,
    multiple: false,
  },
  GREATER_THAN: {
    type: "greaterThan",
    label: "is greater than",
    dataType: "number",
    positive: true,
    multiple: false,
  },
  LESS_THAN: {
    type: "lessThan",
    label: "is less than",
    dataType: "number",
    positive: true,
    multiple: false,
  },
} as const satisfies Record<string, FilterCondition>;

export const BooleanFilterConditions = {
  EQUALS: {
    type: "equals",
    label: "is",
    dataType: "boolean",
    positive: true,
    multiple: false,
  },
} as const satisfies Record<string, FilterCondition>;

export const filterConditions: FilterCondition[] = [
  TextFilterConditions.CONTAINS,
  TextFilterConditions.NOT_CONTAINS,
  ObjectFilterConditions.EQUALS,
  ObjectFilterConditions.NOT_EQUALS,
  ObjectFilterConditions.ANY_OF,
  ObjectFilterConditions.NONE_OF,
  ObjectFilterConditions.INCLUDES,
  ObjectFilterConditions.INCLUDES_ALL,
  ObjectFilterConditions.EXCLUDES,
  ObjectFilterConditions.EXCLUDES_ALL,
  DateFilterConditions.EQUALS,
  DateFilterConditions.BEFORE,
  DateFilterConditions.AFTER,
  DateTimeFilterConditions.EQUALS,
  DateTimeFilterConditions.BEFORE,
  DateTimeFilterConditions.AFTER,
  NumberFilterConditions.EQUALS,
  NumberFilterConditions.GREATER_THAN,
  NumberFilterConditions.LESS_THAN,
  BooleanFilterConditions.EQUALS,
];

// ─────────────────────────────────────────────────────────────────────────────
// Filter option + base config
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The unit of selected value inside a filter pill. Every selected item is
 * wrapped in this — the wrapper preserves a stable `id` (for dedup), a
 * display `label`, and the underlying `value` of any shape.
 */
export type FilterBaseOption<TValue = unknown> = {
  id: string;
  label: string;
  value: TValue;
};

export type FilterBaseConfig = {
  /** Unique key for the filter within a registry. Used as `property` on the value. */
  name: string;
  /** Display label shown in the filter picker and pill. */
  label: string;
  /** Optional icon shown left of the label. */
  icon?: ReactNode;
  /**
   * Free-form metadata. Useful when mapping filter values to a backend payload
   * or when a type-renderer needs config it cannot infer (e.g. boolean
   * label overrides).
   */
  context?: unknown;
  /**
   * Placeholder shown in the popover's command input while this filter is
   * being configured.
   * @default "Filter..."
   */
  inputPlaceholder?: string;
  /** Static options always shown alongside dynamic ones (e.g. date shortcuts). */
  customOptions?: FilterBaseOption[];
  /** When true, the filter cannot be picked from the add-button menu. */
  hidden?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-type configs (discriminated union via `type`)
// ─────────────────────────────────────────────────────────────────────────────

export type FilterTextConfig = FilterBaseConfig & {
  type: "text";
  /**
   * Async lookup for suggestions while the user is typing. The backend
   * decides ranking & cut-off; the renderer just shows what it gets back
   * (capped at 10). When omitted, the renderer only offers free-text
   * commit + any `customOptions`.
   */
  filterSearch?: (searchTerm: string) => Promise<FilterBaseOption<string>[]>;
};

export type FilterNumberConfig = FilterBaseConfig & {
  type: "number";
  minNumber?: number;
  maxNumber?: number;
};

export type FilterDateConfig = FilterBaseConfig & {
  type: "date";
  /** Format function used when rendering a picked date as a pill label. */
  formatDate?: (date: Date) => string;
};

export type FilterDateTimeConfig = FilterBaseConfig & {
  type: "dateTime";
  /** Format function used when rendering a picked datetime as a pill label. */
  formatDate?: (date: Date) => string;
};

export type FilterBooleanConfig = FilterBaseConfig & {
  type: "boolean";
  /**
   * Inverse mode swaps the semantics of true/false — useful for "negative"
   * boolean properties like `deactivated` where the user thinks "Active/Inactive".
   * Also accepts custom labels.
   */
  context?: {
    isInverse?: boolean;
    trueValueLabel?: string;
    falseValueLabel?: string;
  };
};

export type FilterObjectConfig<TOption = unknown> = FilterBaseConfig & {
  type: "select";
  /** Async search — return raw option entities for the given term. */
  filterSearch: (searchTerm: string) => Promise<TOption[]>;
  /** Map a raw entity to the wrapped `FilterBaseOption` shape. */
  mapToFilterOption: (option: TOption) => FilterBaseOption<TOption>;
  /** Render a single option in the dropdown. */
  filterOptionRenderer: (value: FilterBaseOption<TOption>) => ReactNode;
  /** Render the pill predicate when exactly one option is picked. */
  filterSingleOptionRenderer: (value: FilterBaseOption<TOption>[]) => ReactNode;
  /** Render the pill predicate when multiple options are picked. */
  filterMultipleOptionRenderer: (
    value: FilterBaseOption<TOption>[],
  ) => ReactNode;
  /** Whether multi-select is supported. */
  multiple?: boolean;
  /**
   * Set this when the row's property is itself an array (e.g. `tags: string[]`)
   * and you want CONTAINS/IS-ONE-OF semantics rather than equality.
   */
  multipleValues?: boolean;
};

/**
 * Union of every supported filter config. `TOption` only flows through for
 * `select` filters — other variants use their own intrinsic value type.
 */
export type FilterConfig<TOption = unknown> =
  | FilterTextConfig
  | FilterNumberConfig
  | FilterDateConfig
  | FilterDateTimeConfig
  | FilterBooleanConfig
  | FilterObjectConfig<TOption>;

export type FilterOptionRegistry<TOption = unknown> = FilterConfig<TOption>[];

/**
 * The value-shape emitted by `FilterBuilder` via `onChange`. One entry per
 * active filter pill. `value` is intentionally heterogeneous — the underlying
 * shape depends on the filter's `dataType` (string for text/number, Date for
 * date/dateTime, boolean for boolean, TOption for select).
 */
export type FilterBuilderValue<TOption = unknown> = {
  id: string;
  property: string;
  condition: FilterCondition;
  value: FilterBaseOption<TOption>[];
  /** When true, the pill's X button is replaced with a lock icon. */
  locked?: boolean;
  /** When true, the condition dropdown is disabled. */
  lockedCondition?: boolean;
};

export type FilterConfigItemsRenderProps<TFilter extends FilterConfig> = {
  filter: TFilter;
  inputValue: string;
  currentID: string;
};
