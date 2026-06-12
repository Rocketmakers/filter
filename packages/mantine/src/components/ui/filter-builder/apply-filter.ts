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
      obj,
    );
}

function hasId(obj: unknown): obj is { id: unknown } {
  return typeof obj === "object" && obj !== null && "id" in obj;
}

function idOf(maybe: unknown): unknown {
  return hasId(maybe) ? maybe.id : maybe;
}

/** Always returns a fresh Date — callers `setHours` on the result. */
function toDate(input: unknown): Date | null {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === "string" || typeof input === "number") {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toArray(input: unknown): unknown[] {
  return Array.isArray(input) ? input : [];
}

/**
 * Inner switches use `default: return true` as a defensive guard for unknown
 * condition strings (e.g. filters reconstructed from URL state). Empty row
 * collections fail every "ALL" / "NONE" / "EXCLUDES_ALL" — no data, no match.
 */
function applyOneFilter<TRow>(row: TRow, filter: FilterBuilderValue): boolean {
  const { property, condition, value } = filter;
  if (!value || value.length === 0) return true;

  const rawRowValue = getNestedValue(row, property);
  const conditionType = condition.type;
  const isMulti = !!condition.multipleValues;

  switch (condition.dataType) {
    case "text": {
      const needle = String(
        value[0].value ?? value[0].label ?? "",
      ).toLowerCase();

      if (!isMulti) {
        const haystack = String(rawRowValue ?? "").toLowerCase();
        switch (conditionType) {
          case TextFilterConditions.CONTAINS.type:
            return haystack.includes(needle);
          case TextFilterConditions.NOT_CONTAINS.type:
            return !haystack.includes(needle);
          default:
            return true;
        }
      }

      const list = toArray(rawRowValue).map((v) =>
        String(v ?? "").toLowerCase(),
      );
      switch (conditionType) {
        case TextFilterConditions.HAS_ONE_CONTAINING.type:
          return list.some((s) => s.includes(needle));
        case TextFilterConditions.HAS_ONE_NOT_CONTAINING.type:
          return list.some((s) => !s.includes(needle));
        case TextFilterConditions.ALL_CONTAIN.type:
          return list.length > 0 && list.every((s) => s.includes(needle));
        case TextFilterConditions.NONE_CONTAIN.type:
          return list.length > 0 && !list.some((s) => s.includes(needle));
        default:
          return true;
      }
    }

    case "select": {
      const filterIds = value.map((v) => idOf(v.value));
      if (!isMulti) {
        const rowId = idOf(rawRowValue);
        switch (conditionType) {
          case ObjectFilterConditions.EQUALS.type:
            return rowId === filterIds[0];
          case ObjectFilterConditions.NOT_EQUALS.type:
            return rowId !== filterIds[0];
          /** Falls back to collection membership when the row field is an
           *  array despite a singular (`multipleValues: false`) registry. */
          case ObjectFilterConditions.ANY_OF.type:
            if (Array.isArray(rawRowValue)) {
              return filterIds.some((fid) =>
                rawRowValue.some((rv) => idOf(rv) === fid),
              );
            }
            return filterIds.some((fid) => fid === rowId);
          case ObjectFilterConditions.NONE_OF.type:
            if (Array.isArray(rawRowValue)) {
              return !filterIds.some((fid) =>
                rawRowValue.some((rv) => idOf(rv) === fid),
              );
            }
            return !filterIds.some((fid) => fid === rowId);
          default:
            return true;
        }
      }

      const rowIds = toArray(rawRowValue).map(idOf);
      switch (conditionType) {
        case ObjectFilterConditions.INCLUDES.type:
          return filterIds.some((fid) => rowIds.includes(fid));
        case ObjectFilterConditions.INCLUDES_ALL.type:
          return filterIds.every((fid) => rowIds.includes(fid));
        case ObjectFilterConditions.EXCLUDES.type:
          return !filterIds.some((fid) => rowIds.includes(fid));
        case ObjectFilterConditions.EXCLUDES_ALL.type:
          return (
            rowIds.length > 0 &&
            filterIds.every((fid) => !rowIds.includes(fid))
          );
        case ObjectFilterConditions.ARE_ALL.type:
          return (
            rowIds.length > 0 && rowIds.every((rid) => rid === filterIds[0])
          );
        default:
          return true;
      }
    }

    case "date":
    case "dateTime": {
      const filterDate = toDate(value[0].value ?? value[0].label);
      if (!filterDate) return true;
      const isDate = condition.dataType === "date";
      if (isDate) filterDate.setHours(0, 0, 0, 0);
      const filterT = filterDate.getTime();

      const dateConditions = isDate
        ? DateFilterConditions
        : DateTimeFilterConditions;

      if (!isMulti) {
        const rowDate = toDate(rawRowValue);
        if (!rowDate) return true;
        if (isDate) rowDate.setHours(0, 0, 0, 0);
        const rowT = rowDate.getTime();
        switch (conditionType) {
          case dateConditions.EQUALS.type:
            return rowT === filterT;
          case dateConditions.BEFORE.type:
            return rowT < filterT;
          case dateConditions.AFTER.type:
            return rowT > filterT;
          default:
            return true;
        }
      }

      const list = toArray(rawRowValue)
        .map(toDate)
        .filter((d): d is Date => d !== null);
      if (isDate) list.forEach((d) => d.setHours(0, 0, 0, 0));
      const times = list.map((d) => d.getTime());

      switch (conditionType) {
        case dateConditions.HAS_ONE_ON.type:
          return times.some((t) => t === filterT);
        case dateConditions.HAS_ONE_BEFORE.type:
          return times.some((t) => t < filterT);
        case dateConditions.HAS_ONE_AFTER.type:
          return times.some((t) => t > filterT);
        case dateConditions.ALL_ARE_ON.type:
          return times.length > 0 && times.every((t) => t === filterT);
        case dateConditions.ALL_ARE_BEFORE.type:
          return times.length > 0 && times.every((t) => t < filterT);
        case dateConditions.ALL_ARE_AFTER.type:
          return times.length > 0 && times.every((t) => t > filterT);
        default:
          return true;
      }
    }

    case "number": {
      const filterNum = Number(value[0].value ?? value[0].label);
      if (Number.isNaN(filterNum)) return true;

      if (!isMulti) {
        const rowNum = Number(rawRowValue);
        if (Number.isNaN(rowNum)) return true;
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

      const list = toArray(rawRowValue)
        .map((v) => Number(v))
        .filter((n) => !Number.isNaN(n));

      switch (conditionType) {
        case NumberFilterConditions.HAS_ONE_EQUAL.type:
          return list.some((n) => n === filterNum);
        case NumberFilterConditions.HAS_ONE_GREATER_THAN.type:
          return list.some((n) => n > filterNum);
        case NumberFilterConditions.HAS_ONE_LESS_THAN.type:
          return list.some((n) => n < filterNum);
        case NumberFilterConditions.ALL_EQUAL.type:
          return list.length > 0 && list.every((n) => n === filterNum);
        case NumberFilterConditions.ALL_GREATER_THAN.type:
          return list.length > 0 && list.every((n) => n > filterNum);
        case NumberFilterConditions.ALL_LESS_THAN.type:
          return list.length > 0 && list.every((n) => n < filterNum);
        default:
          return true;
      }
    }

    case "boolean": {
      const filterBool = Boolean(value[0].value);

      // `EQUALS` is the only singular boolean condition, so the !isMulti
      // branch is just the comparison — no inner switch needed.
      if (!isMulti) return Boolean(rawRowValue) === filterBool;

      const list = toArray(rawRowValue).map((v) => Boolean(v));
      switch (conditionType) {
        case BooleanFilterConditions.HAS_ONE_EQUAL.type:
          return list.some((b) => b === filterBool);
        case BooleanFilterConditions.ALL_EQUAL.type:
          return list.length > 0 && list.every((b) => b === filterBool);
        default:
          return true;
      }
    }
  }
}

export function applyFilters<TRow>(
  row: TRow,
  filters: FilterBuilderValue[],
): boolean {
  return filters.every((filter) => applyOneFilter(row, filter));
}

export function filterRows<TRow>(
  rows: TRow[],
  filters: FilterBuilderValue[],
): TRow[] {
  if (!filters || filters.length === 0) return rows;
  return rows.filter((row) => applyFilters(row, filters));
}

export function useFilteredRows<TRow>(
  rows: TRow[],
  filters: FilterBuilderValue[],
): TRow[] {
  return useMemo(() => filterRows(rows, filters), [rows, filters]);
}
