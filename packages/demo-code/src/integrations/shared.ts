/**
 * Type shapes shared by every integration example. Structurally identical
 * to what the per-package filter-builder exports — when a developer pastes
 * one of these snippets into their own codebase they'd swap this import
 * for:
 *
 *   import {
 *     type FilterBuilderValue,
 *     type FilterCondition,
 *     filterConditions,
 *   } from "@/components/ui/filter-builder";
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
  dataType: FilterDataType;
  positive?: boolean;
  multiple?: boolean | "bothMultipleAndSingle";
  multipleValues?: boolean;
};

export type FilterBuilderValue = {
  id: string;
  property: string;
  condition: FilterCondition;
  value: { id: string; label: string; value: unknown }[];
  locked?: boolean;
  lockedCondition?: boolean;
};

/** Minimal registry shape (`{ name, type }` is enough for URL parsing). */
export type FilterFieldConfig = {
  name: string;
  type: FilterDataType;
};

/**
 * Stand-ins for the runtime values your real filter-builder exports.
 * Wired up via demo-code's tsconfig path alias so `import { ... } from
 * "@/components/ui/filter-builder"` resolves here at type-check time. In
 * a consumer project the same import resolves to the real implementation.
 */
export const filterConditions: FilterCondition[] = [];

export declare function useFilteredRows<T>(
  rows: T[],
  filters: FilterBuilderValue[],
): T[];

export declare function FilterBuilder(props: {
  id?: string;
  filters: ReadonlyArray<{ name: string; type: FilterDataType }>;
  value: FilterBuilderValue[];
  onChange: (next: FilterBuilderValue[]) => void;
}): import("react").ReactNode;
