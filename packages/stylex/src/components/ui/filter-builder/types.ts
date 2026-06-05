import type { ReactNode } from "react";

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
  dataType: FilterDataType;
  positive?: boolean;
  icon?: ReactNode;
  multiple?: boolean | "bothMultipleAndSingle";
  multipleValues?: boolean;
};

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
  EQUALS: { type: "equals", label: "is", dataType: "select", positive: true, multiple: false },
  NOT_EQUALS: { type: "notEquals", label: "is not", dataType: "select", positive: false, multiple: false },
  ANY_OF: { type: "anyOf", label: "is one of", dataType: "select", positive: true, multiple: true },
  NONE_OF: { type: "noneOf", label: "is not one of", dataType: "select", positive: false, multiple: true },
  INCLUDES: { type: "includes", label: "has one of", dataType: "select", positive: true, multiple: "bothMultipleAndSingle", multipleValues: true },
  INCLUDES_ALL: { type: "includesAll", label: "has all", dataType: "select", positive: true, multiple: true, multipleValues: true },
  EXCLUDES: { type: "excludes", label: "missing one of", dataType: "select", positive: false, multiple: "bothMultipleAndSingle", multipleValues: true },
  EXCLUDES_ALL: { type: "excludesAll", label: "missing all", dataType: "select", positive: false, multiple: true, multipleValues: true },
} as const satisfies Record<string, FilterCondition>;

export const DateFilterConditions = {
  EQUALS: { type: "equals", label: "is", dataType: "date", positive: true, multiple: false },
  BEFORE: { type: "before", label: "is before", dataType: "date", positive: true, multiple: false },
  AFTER: { type: "after", label: "is after", dataType: "date", positive: true, multiple: false },
} as const satisfies Record<string, FilterCondition>;

export const DateTimeFilterConditions = {
  EQUALS: { type: "equals", label: "is", dataType: "dateTime", positive: true, multiple: false },
  BEFORE: { type: "before", label: "is before", dataType: "dateTime", positive: true, multiple: false },
  AFTER: { type: "after", label: "is after", dataType: "dateTime", positive: true, multiple: false },
} as const satisfies Record<string, FilterCondition>;

export const NumberFilterConditions = {
  EQUALS: { type: "equals", label: "is", dataType: "number", positive: true, multiple: false },
  GREATER_THAN: { type: "greaterThan", label: "is greater than", dataType: "number", positive: true, multiple: false },
  LESS_THAN: { type: "lessThan", label: "is less than", dataType: "number", positive: true, multiple: false },
} as const satisfies Record<string, FilterCondition>;

export const BooleanFilterConditions = {
  EQUALS: { type: "equals", label: "is", dataType: "boolean", positive: true, multiple: false },
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
};

export type FilterNumberConfig = FilterBaseConfig & {
  type: "number";
  minNumber?: number;
  maxNumber?: number;
};

export type FilterDateConfig = FilterBaseConfig & {
  type: "date";
  formatDate?: (date: Date) => string;
};

export type FilterDateTimeConfig = FilterBaseConfig & {
  type: "dateTime";
  formatDate?: (date: Date) => string;
};

export type FilterBooleanConfig = FilterBaseConfig & {
  type: "boolean";
  context?: {
    isInverse?: boolean;
    trueValueLabel?: string;
    falseValueLabel?: string;
  };
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

export type FilterOptionRegistry<TOption = unknown> = FilterConfig<TOption>[];

export type FilterBuilderValue<TOption = unknown> = {
  id: string;
  property: string;
  condition: FilterCondition;
  value: FilterBaseOption<TOption>[];
  locked?: boolean;
  lockedCondition?: boolean;
};

export type FilterConfigItemsRenderProps<TFilter extends FilterConfig> = {
  filter: TFilter;
  inputValue: string;
  currentID: string;
};
