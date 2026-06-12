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
  type: string;
  label: string;
  /** Override `label` when only one filter value is selected. e.g. "has any of" → "has". */
  singleLabel?: string;
  dataType: FilterDataType;
  positive?: boolean;
  icon?: ReactNode;
  multiple?: boolean | "bothMultipleAndSingle";
  multipleValues?: boolean;
};

// Condition registries

// Text conditions split into two sets based on the shape of the field. Single
// text fields ("the row's name contains X") use CONTAINS/NOT_CONTAINS. Plural
// text fields ("the row's tags include one containing X") use the HAS_ONE_*
// / ALL_* / NONE_CONTAIN set. Which set surfaces is driven by
// `FilterTextConfig.multipleValues` — same flag the select/date sides use.
export const TextFilterConditions = {
  CONTAINS: {
    type: "contains",
    label: "contains",
    dataType: "text",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  NOT_CONTAINS: {
    type: "notContains",
    label: "does not contain",
    dataType: "text",
    positive: false,
    multiple: false,
    multipleValues: false,
  },
  HAS_ONE_CONTAINING: {
    type: "hasOneContaining",
    label: "have one containing",
    dataType: "text",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  HAS_ONE_NOT_CONTAINING: {
    type: "hasOneNotContaining",
    label: "have one not containing",
    dataType: "text",
    positive: false,
    multiple: false,
    multipleValues: true,
  },
  ALL_CONTAIN: {
    type: "allContain",
    label: "all contain",
    dataType: "text",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  NONE_CONTAIN: {
    type: "noneContain",
    label: "do not contain",
    dataType: "text",
    positive: false,
    multiple: false,
    multipleValues: true,
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
    label: "has any of",
    singleLabel: "has",
    dataType: "select",
    positive: true,
    multiple: "bothMultipleAndSingle",
    multipleValues: true,
  },
  INCLUDES_ALL: {
    type: "includesAll",
    label: "has all of",
    dataType: "select",
    positive: true,
    multiple: true,
    multipleValues: true,
  },
  EXCLUDES: {
    type: "excludes",
    label: "is missing any of",
    singleLabel: "is missing",
    dataType: "select",
    positive: false,
    multiple: "bothMultipleAndSingle",
    multipleValues: true,
  },
  EXCLUDES_ALL: {
    type: "excludesAll",
    label: "has none of",
    dataType: "select",
    positive: false,
    multiple: true,
    multipleValues: true,
  },
  ARE_ALL: {
    type: "areAll",
    label: "are all",
    dataType: "select",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
} as const satisfies Record<string, FilterCondition>;

// Date conditions split into two sets based on the shape of the underlying
// field. Single-date fields ("when did X happen?") use the EQUALS/BEFORE/AFTER
// trio. Multi-date fields ("which days did X happen on?") use the HAS_ONE_*
// / ALL_ARE_* set. Which set surfaces in the operator menu is driven by
// `FilterDateConfig.multipleValues` — the same flag the select side uses.
export const DateFilterConditions = {
  EQUALS: {
    type: "equals",
    label: "is",
    dataType: "date",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  BEFORE: {
    type: "before",
    label: "is before",
    dataType: "date",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  AFTER: {
    type: "after",
    label: "is after",
    dataType: "date",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  HAS_ONE_ON: {
    type: "hasOneOn",
    label: "have one on",
    dataType: "date",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  HAS_ONE_BEFORE: {
    type: "hasOneBefore",
    label: "have one before",
    dataType: "date",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  HAS_ONE_AFTER: {
    type: "hasOneAfter",
    label: "have one after",
    dataType: "date",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  ALL_ARE_ON: {
    type: "allAreOn",
    label: "are all on",
    dataType: "date",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  ALL_ARE_BEFORE: {
    type: "allAreBefore",
    label: "are all before",
    dataType: "date",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  ALL_ARE_AFTER: {
    type: "allAreAfter",
    label: "are all after",
    dataType: "date",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
} as const satisfies Record<string, FilterCondition>;

export const DateTimeFilterConditions = {
  EQUALS: {
    type: "equals",
    label: "is",
    dataType: "dateTime",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  BEFORE: {
    type: "before",
    label: "is before",
    dataType: "dateTime",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  AFTER: {
    type: "after",
    label: "is after",
    dataType: "dateTime",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  HAS_ONE_ON: {
    type: "hasOneOn",
    label: "have one on",
    dataType: "dateTime",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  HAS_ONE_BEFORE: {
    type: "hasOneBefore",
    label: "have one before",
    dataType: "dateTime",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  HAS_ONE_AFTER: {
    type: "hasOneAfter",
    label: "have one after",
    dataType: "dateTime",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  ALL_ARE_ON: {
    type: "allAreOn",
    label: "are all on",
    dataType: "dateTime",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  ALL_ARE_BEFORE: {
    type: "allAreBefore",
    label: "are all before",
    dataType: "dateTime",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  ALL_ARE_AFTER: {
    type: "allAreAfter",
    label: "are all after",
    dataType: "dateTime",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
} as const satisfies Record<string, FilterCondition>;

// See {@link TextFilterConditions} comment — same pattern. Plural-field number
// (e.g. a row's `scoreHistory: number[]`) uses HAS_ONE_* / ALL_* variants.
export const NumberFilterConditions = {
  EQUALS: {
    type: "equals",
    label: "is",
    dataType: "number",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  GREATER_THAN: {
    type: "greaterThan",
    label: "is greater than",
    dataType: "number",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  LESS_THAN: {
    type: "lessThan",
    label: "is less than",
    dataType: "number",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  HAS_ONE_EQUAL: {
    type: "hasOneEqual",
    label: "have one equal to",
    dataType: "number",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  ALL_EQUAL: {
    type: "allEqual",
    label: "are all",
    dataType: "number",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  HAS_ONE_GREATER_THAN: {
    type: "hasOneGreaterThan",
    label: "have one greater than",
    dataType: "number",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  ALL_GREATER_THAN: {
    type: "allGreaterThan",
    label: "are all greater than",
    dataType: "number",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  HAS_ONE_LESS_THAN: {
    type: "hasOneLessThan",
    label: "have one less than",
    dataType: "number",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  ALL_LESS_THAN: {
    type: "allLessThan",
    label: "are all less than",
    dataType: "number",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
} as const satisfies Record<string, FilterCondition>;

// See {@link TextFilterConditions} comment — same pattern. Plural-field boolean
// (e.g. a row's `flags: boolean[]`) uses HAS_ONE_EQUAL / ALL_EQUAL.
export const BooleanFilterConditions = {
  EQUALS: {
    type: "equals",
    label: "is",
    dataType: "boolean",
    positive: true,
    multiple: false,
    multipleValues: false,
  },
  HAS_ONE_EQUAL: {
    type: "hasOneEqual",
    label: "have one that is",
    dataType: "boolean",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
  ALL_EQUAL: {
    type: "allEqual",
    label: "are all",
    dataType: "boolean",
    positive: true,
    multiple: false,
    multipleValues: true,
  },
} as const satisfies Record<string, FilterCondition>;

export const filterConditions: FilterCondition[] = [
  TextFilterConditions.CONTAINS,
  TextFilterConditions.NOT_CONTAINS,
  TextFilterConditions.HAS_ONE_CONTAINING,
  TextFilterConditions.HAS_ONE_NOT_CONTAINING,
  TextFilterConditions.ALL_CONTAIN,
  TextFilterConditions.NONE_CONTAIN,
  ObjectFilterConditions.EQUALS,
  ObjectFilterConditions.NOT_EQUALS,
  ObjectFilterConditions.ANY_OF,
  ObjectFilterConditions.NONE_OF,
  ObjectFilterConditions.INCLUDES,
  ObjectFilterConditions.INCLUDES_ALL,
  ObjectFilterConditions.EXCLUDES,
  ObjectFilterConditions.EXCLUDES_ALL,
  ObjectFilterConditions.ARE_ALL,
  DateFilterConditions.EQUALS,
  DateFilterConditions.BEFORE,
  DateFilterConditions.AFTER,
  DateFilterConditions.HAS_ONE_ON,
  DateFilterConditions.HAS_ONE_BEFORE,
  DateFilterConditions.HAS_ONE_AFTER,
  DateFilterConditions.ALL_ARE_ON,
  DateFilterConditions.ALL_ARE_BEFORE,
  DateFilterConditions.ALL_ARE_AFTER,
  DateTimeFilterConditions.EQUALS,
  DateTimeFilterConditions.BEFORE,
  DateTimeFilterConditions.AFTER,
  DateTimeFilterConditions.HAS_ONE_ON,
  DateTimeFilterConditions.HAS_ONE_BEFORE,
  DateTimeFilterConditions.HAS_ONE_AFTER,
  DateTimeFilterConditions.ALL_ARE_ON,
  DateTimeFilterConditions.ALL_ARE_BEFORE,
  DateTimeFilterConditions.ALL_ARE_AFTER,
  NumberFilterConditions.EQUALS,
  NumberFilterConditions.GREATER_THAN,
  NumberFilterConditions.LESS_THAN,
  NumberFilterConditions.HAS_ONE_EQUAL,
  NumberFilterConditions.ALL_EQUAL,
  NumberFilterConditions.HAS_ONE_GREATER_THAN,
  NumberFilterConditions.ALL_GREATER_THAN,
  NumberFilterConditions.HAS_ONE_LESS_THAN,
  NumberFilterConditions.ALL_LESS_THAN,
  BooleanFilterConditions.EQUALS,
  BooleanFilterConditions.HAS_ONE_EQUAL,
  BooleanFilterConditions.ALL_EQUAL,
];

export type FilterBaseOption<TValue = unknown> = {
  id: string;
  label: string;
  value: TValue;
};

export type FilterBaseConfig = {
  name: string;
  label: string;
  icon?: ReactNode;
  context?: unknown;
  inputPlaceholder?: string;
  customOptions?: FilterBaseOption[];
  hidden?: boolean;
};

export type FilterTextConfig = FilterBaseConfig & {
  type: "text";
  filterSearch?: (searchTerm: string) => Promise<FilterBaseOption<string>[]>;
  /** See {@link FilterDateConfig.multipleValues}. */
  multipleValues?: boolean;
};

export type FilterNumberConfig = FilterBaseConfig & {
  type: "number";
  minNumber?: number;
  maxNumber?: number;
  /** See {@link FilterDateConfig.multipleValues}. */
  multipleValues?: boolean;
};

export type FilterDateShortcut = {
  id: string;
  label: string;
  build: () => Date;
};

export type FilterDateConfig = FilterBaseConfig & {
  type: "date";
  formatDate?: (date: Date) => string;
  shortcuts?: FilterDateShortcut[];
  /**
   * Set to true when the underlying field is a collection of dates rather
   * than a single date. Surfaces the `has one on / all are on / …` operators
   * instead of `is / is before / is after`.
   */
  multipleValues?: boolean;
};

export type FilterDateTimeConfig = FilterBaseConfig & {
  type: "dateTime";
  formatDate?: (date: Date) => string;
  shortcuts?: FilterDateShortcut[];
  /** See {@link FilterDateConfig.multipleValues}. */
  multipleValues?: boolean;
};

export type FilterBooleanConfig = FilterBaseConfig & {
  type: "boolean";
  context?: {
    isInverse?: boolean;
    trueValueLabel?: string;
    falseValueLabel?: string;
  };
  /** See {@link FilterDateConfig.multipleValues}. */
  multipleValues?: boolean;
};

export type FilterObjectConfig<TOption = unknown> = FilterBaseConfig & {
  type: "select";
  filterSearch: (searchTerm: string) => Promise<TOption[]>;
  mapToFilterOption: (option: TOption) => FilterBaseOption<TOption>;
  filterOptionRenderer: (value: FilterBaseOption<TOption>) => ReactNode;
  filterSingleOptionRenderer: (value: FilterBaseOption<TOption>[]) => ReactNode;
  filterMultipleOptionRenderer: (
    value: FilterBaseOption<TOption>[],
  ) => ReactNode;
  multiple?: boolean;
  multipleValues?: boolean;
};

export type FilterConfig<TOption = unknown> =
  | FilterTextConfig
  | FilterNumberConfig
  | FilterDateConfig
  | FilterDateTimeConfig
  | FilterBooleanConfig
  | FilterObjectConfig<TOption>;

/**
 * A registry of filter configs. Select entries should pin their `TOption`
 * with `satisfies FilterObjectConfig<MyEntity>` per item, since
 * `FilterObjectConfig` is invariant in `TOption` (it appears in input
 * positions like `mapToFilterOption`). The registry uses
 * `FilterObjectConfig<any>` as the "existential" container.
 */
export type FilterOptionRegistry = Array<
  | FilterTextConfig
  | FilterNumberConfig
  | FilterDateConfig
  | FilterDateTimeConfig
  | FilterBooleanConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | FilterObjectConfig<any>
>;

export type FilterBuilderValue = {
  id: string;
  property: string;
  condition: FilterCondition;
  value: FilterBaseOption[];
  locked?: boolean;
  lockedCondition?: boolean;
};

export type FilterConfigItemsRenderProps<TFilter extends FilterConfig> = {
  filter: TFilter;
  inputValue: string;
  currentID: string;
};
