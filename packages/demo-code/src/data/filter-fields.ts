import {
  searchDepartments,
  searchSkills,
  searchSuggestions,
} from "./suggestions-api.ts";
import type { Department, Skill } from "./employees.ts";

/**
 * UI-agnostic filter-field definitions. Each UI package's registry.tsx
 * imports `baseFilterFields`, then layers framework-specific bits (icons,
 * Badge-based renderers) keyed by the `name` field.
 *
 * The types here intentionally mirror the per-package filter-builder
 * config types — *without* any React/JSX surface area, so this file is
 * `.ts` and can live in the shared package.
 */

/** Structural superset of every UI package's `FilterBaseOption<T>`. */
export type BaseFilterOption<TValue = unknown> = {
  id: string;
  label: string;
  value: TValue;
};

/** Subset of FilterDateShortcut that doesn't depend on UI types. */
export type DateShortcut = {
  id: string;
  label: string;
  build: () => Date;
};

type Common = {
  name: string;
  label: string;
};

export type BaseTextField = Common & {
  type: "text";
  multipleValues?: boolean;
  filterSearch?: (term: string) => Promise<BaseFilterOption<string>[]>;
};

export type BaseNumberField = Common & {
  type: "number";
  multipleValues?: boolean;
  minNumber?: number;
  maxNumber?: number;
};

export type BaseDateField = Common & {
  type: "date";
  multipleValues?: boolean;
  shortcuts?: DateShortcut[];
};

export type BaseDateTimeField = Common & {
  type: "dateTime";
  multipleValues?: boolean;
  shortcuts?: DateShortcut[];
};

export type BaseBooleanField = Common & {
  type: "boolean";
  context?: {
    isInverse?: boolean;
    trueValueLabel?: string;
    falseValueLabel?: string;
  };
};

export type BaseSelectField<TOption> = Common & {
  type: "select";
  multiple?: boolean;
  multipleValues?: boolean;
  filterSearch: (term: string) => Promise<TOption[]>;
  mapToFilterOption: (option: TOption) => BaseFilterOption<TOption>;
};

export type BaseFilterField =
  | BaseTextField
  | BaseNumberField
  | BaseDateField
  | BaseDateTimeField
  | BaseBooleanField
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | BaseSelectField<any>;

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const minutesAgo = (mins: number): Date =>
  new Date(Date.now() - mins * 60_000);

export const dateShortcuts: DateShortcut[] = [
  { id: "today", label: "Today", build: () => startOfToday() },
  {
    id: "yesterday",
    label: "Yesterday",
    build: () => {
      const d = startOfToday();
      d.setDate(d.getDate() - 1);
      return d;
    },
  },
  {
    id: "last-week",
    label: "1 week ago",
    build: () => {
      const d = startOfToday();
      d.setDate(d.getDate() - 7);
      return d;
    },
  },
  {
    id: "last-month",
    label: "1 month ago",
    build: () => {
      const d = startOfToday();
      d.setMonth(d.getMonth() - 1);
      return d;
    },
  },
  {
    id: "last-year",
    label: "1 year ago",
    build: () => {
      const d = startOfToday();
      d.setFullYear(d.getFullYear() - 1);
      return d;
    },
  },
  {
    id: "next-week",
    label: "In 1 week",
    build: () => {
      const d = startOfToday();
      d.setDate(d.getDate() + 7);
      return d;
    },
  },
];

export const dateTimeShortcuts: DateShortcut[] = [
  { id: "now", label: "Right now", build: () => new Date() },
  { id: "5m", label: "5 minutes ago", build: () => minutesAgo(5) },
  { id: "1h", label: "1 hour ago", build: () => minutesAgo(60) },
  {
    id: "today-9am",
    label: "Today 9am",
    build: () => {
      const d = new Date();
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
  { id: "24h", label: "24 hours ago", build: () => minutesAgo(60 * 24) },
];

const departmentToOption = (
  dept: Department,
): BaseFilterOption<Department> => ({
  id: dept.id,
  label: dept.name,
  value: dept,
});

const skillToOption = (skill: Skill): BaseFilterOption<Skill> => ({
  id: skill.id,
  label: skill.name,
  value: skill,
});

export const baseFilterFields: BaseFilterField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    filterSearch: (term) => searchSuggestions("name", term),
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    filterSearch: (term) => searchSuggestions("email", term),
  },
  {
    name: "department",
    label: "Department",
    type: "select",
    multiple: true,
    filterSearch: searchDepartments,
    mapToFilterOption: departmentToOption,
  } satisfies BaseSelectField<Department>,
  {
    name: "skills",
    label: "Skills",
    type: "select",
    multiple: true,
    multipleValues: true,
    filterSearch: searchSkills,
    mapToFilterOption: skillToOption,
  } satisfies BaseSelectField<Skill>,
  {
    name: "role",
    label: "Role",
    type: "text",
    filterSearch: (term) => searchSuggestions("role", term),
  },
  {
    name: "salary",
    label: "Salary",
    type: "number",
    minNumber: 0,
  },
  {
    name: "hireDate",
    label: "Hire date",
    type: "date",
    shortcuts: dateShortcuts,
  },
  {
    name: "lastLogin",
    label: "Last login",
    type: "dateTime",
    shortcuts: dateTimeShortcuts,
  },
  {
    name: "aliases",
    label: "Aliases",
    type: "text",
    multipleValues: true,
  },
  {
    name: "quarterlyScores",
    label: "Quarterly scores",
    type: "number",
    multipleValues: true,
    minNumber: 0,
    maxNumber: 5,
  },
  {
    name: "performanceReviewDates",
    label: "Performance reviews",
    type: "date",
    multipleValues: true,
    shortcuts: dateShortcuts,
  },
  {
    name: "shiftStarts",
    label: "Shift starts",
    type: "dateTime",
    multipleValues: true,
    shortcuts: dateTimeShortcuts,
  },
  {
    name: "isActive",
    label: "Active",
    type: "boolean",
    context: { trueValueLabel: "Active", falseValueLabel: "Inactive" },
  },
];
