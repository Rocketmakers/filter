import { useMemo } from "react";

import {
  BooleanFilterConditions,
  DateFilterConditions,
  DateTimeFilterConditions,
  NumberFilterConditions,
  ObjectFilterConditions,
  TextFilterConditions,
  type FilterBuilderValue,
} from "./types";

/** Read a value via dot-notation: `"assignee.name"` → `obj.assignee.name`. */
export function getNestedValue(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (current, key) =>
        current && typeof current === "object"
          ? (current as Record<string, unknown>)[key]
          : undefined,
      obj
    );
}

function hasId(obj: unknown): obj is { id: string } {
  return typeof obj === "object" && obj !== null && "id" in obj;
}

function idOf(maybe: unknown): unknown {
  return hasId(maybe) ? maybe.id : maybe;
}

function toDate(input: unknown): Date | null {
  if (input instanceof Date) return input;
  if (typeof input === "string" || typeof input === "number") {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Apply a single pill to one row. Returns true if the row passes. */
function applyOneFilter<TRow>(row: TRow, filter: FilterBuilderValue): boolean {
  const { property, condition, value } = filter;
  if (!value || value.length === 0) return true;

  const rawRowValue = getNestedValue(row, property);
  const conditionType = condition.type;

  switch (condition.dataType) {
    case "text": {
      const haystack = String(rawRowValue ?? "").toLowerCase();
      const needles = value.map((v) =>
        String(v.value ?? v.label ?? "").toLowerCase()
      );
      switch (conditionType) {
        case TextFilterConditions.CONTAINS.type:
          return needles.some((n) => haystack.includes(n));
        case TextFilterConditions.NOT_CONTAINS.type:
          return !needles.some((n) => haystack.includes(n));
        default:
          return true;
      }
    }

    case "select": {
      const filterIds = value.map((v) => idOf(v.value));
      if (!condition.multipleValues) {
        const rowId = idOf(rawRowValue);
        switch (conditionType) {
          case ObjectFilterConditions.EQUALS.type:
            return rowId === filterIds[0];
          case ObjectFilterConditions.NOT_EQUALS.type:
            return rowId !== filterIds[0];
          case ObjectFilterConditions.ANY_OF.type:
            if (Array.isArray(rawRowValue)) {
              return filterIds.some((fid) =>
                (rawRowValue as unknown[]).some((rv) => idOf(rv) === fid)
              );
            }
            return filterIds.some((fid) => fid === rowId);
          case ObjectFilterConditions.NONE_OF.type:
            if (Array.isArray(rawRowValue)) {
              return !filterIds.some((fid) =>
                (rawRowValue as unknown[]).some((rv) => idOf(rv) === fid)
              );
            }
            return !filterIds.some((fid) => fid === rowId);
          default:
            return true;
        }
      }

      // multipleValues — row property is itself an array.
      const rowList: unknown[] = Array.isArray(rawRowValue) ? rawRowValue : [];
      const rowIds = rowList.map(idOf);
      switch (conditionType) {
        case ObjectFilterConditions.INCLUDES.type:
          return filterIds.some((fid) => rowIds.includes(fid));
        case ObjectFilterConditions.INCLUDES_ALL.type:
          return filterIds.every((fid) => rowIds.includes(fid));
        case ObjectFilterConditions.EXCLUDES.type:
          return !filterIds.some((fid) => rowIds.includes(fid));
        case ObjectFilterConditions.EXCLUDES_ALL.type:
          return filterIds.every((fid) => !rowIds.includes(fid));
        default:
          return true;
      }
    }

    case "date":
    case "dateTime": {
      const rowDate = toDate(rawRowValue);
      const filterDate = toDate(value[0].value ?? value[0].label);
      if (!rowDate || !filterDate) return true;

      if (condition.dataType === "date") {
        rowDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);
      }

      const dateConditions =
        condition.dataType === "date"
          ? DateFilterConditions
          : DateTimeFilterConditions;

      switch (conditionType) {
        case dateConditions.EQUALS.type:
          return rowDate.getTime() === filterDate.getTime();
        case dateConditions.BEFORE.type:
          return rowDate.getTime() < filterDate.getTime();
        case dateConditions.AFTER.type:
          return rowDate.getTime() > filterDate.getTime();
        default:
          return true;
      }
    }

    case "number": {
      const rowNum = Number(rawRowValue);
      const filterNum = Number(value[0].value ?? value[0].label);
      if (Number.isNaN(rowNum) || Number.isNaN(filterNum)) return true;
      switch (conditionType) {
        case NumberFilterConditions.EQUALS.type:
          return rowNum === filterNum;
        case NumberFilterConditions.GREATER_THAN.type:
          return rowNum > filterNum;
        case NumberFilterConditions.LESS_THAN.type:
          return rowNum < filterNum;
        default:
          return true;
      }
    }

    case "boolean": {
      const rowBool = Boolean(rawRowValue);
      const filterBool = Boolean(value[0].value);
      if (conditionType === BooleanFilterConditions.EQUALS.type) {
        return rowBool === filterBool;
      }
      return true;
    }

    default:
      return true;
  }
}

/** Apply every pill (AND-combined) to one row. */
export function applyFilters<TRow>(
  row: TRow,
  filters: FilterBuilderValue[]
): boolean {
  return filters.every((filter) => applyOneFilter(row, filter));
}

/** Apply every pill to an array of rows. */
export function filterRows<TRow>(
  rows: TRow[],
  filters: FilterBuilderValue[]
): TRow[] {
  if (!filters || filters.length === 0) return rows;
  return rows.filter((row) => applyFilters(row, filters));
}

/** Hook-flavored variant of `filterRows` with `useMemo` baked in. */
export function useFilteredRows<TRow>(
  rows: TRow[],
  filters: FilterBuilderValue[]
): TRow[] {
  return useMemo(() => filterRows(rows, filters), [rows, filters]);
}
