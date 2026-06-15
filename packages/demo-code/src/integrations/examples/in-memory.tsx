import * as React from "react";

import {
  FilterBuilder,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import type { Employee } from "../../data/employees.ts";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const hasId = (v: unknown): v is { id: unknown } =>
  typeof v === "object" && v !== null && "id" in v;

const getNestedValue = (obj: unknown, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (current, key) => (isRecord(current) ? current[key] : undefined),
      obj,
    );

const idOf = (value: unknown): unknown => (hasId(value) ? value.id : value);

const toArray = (input: unknown): unknown[] =>
  Array.isArray(input) ? input : [];

const toDate = (input: unknown): Date | null => {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === "string" || typeof input === "number") {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const startOfDay = (date: Date): Date => {
  const next = new Date(date.getTime());
  next.setHours(0, 0, 0, 0);
  return next;
};

const applyText = (rowValue: unknown, filter: FilterBuilderValue): boolean => {
  const needle = String(
    filter.value[0].value ?? filter.value[0].label ?? "",
  ).toLowerCase();
  const isMulti = !!filter.condition.multipleValues;

  if (!isMulti) {
    const haystack = String(rowValue ?? "").toLowerCase();
    switch (filter.condition.type) {
      case "contains":
        return haystack.includes(needle);
      case "notContains":
        return !haystack.includes(needle);
      default:
        return true;
    }
  }

  const list = toArray(rowValue).map((v) => String(v ?? "").toLowerCase());
  switch (filter.condition.type) {
    case "hasOneContaining":
      return list.some((s) => s.includes(needle));
    case "hasOneNotContaining":
      return list.some((s) => !s.includes(needle));
    case "allContain":
      return list.length > 0 && list.every((s) => s.includes(needle));
    case "noneContain":
      return list.length > 0 && !list.some((s) => s.includes(needle));
    default:
      return true;
  }
};

const applySelect = (
  rowValue: unknown,
  filter: FilterBuilderValue,
): boolean => {
  const filterIds = filter.value.map((v) => idOf(v.value));
  const isMulti = !!filter.condition.multipleValues;

  if (!isMulti) {
    const rowId = idOf(rowValue);
    switch (filter.condition.type) {
      case "equals":
        return rowId === filterIds[0];
      case "notEquals":
        return rowId !== filterIds[0];
      case "anyOf":
        if (Array.isArray(rowValue)) {
          return filterIds.some((fid) =>
            rowValue.some((rv) => idOf(rv) === fid),
          );
        }
        return filterIds.some((fid) => fid === rowId);
      case "noneOf":
        if (Array.isArray(rowValue)) {
          return !filterIds.some((fid) =>
            rowValue.some((rv) => idOf(rv) === fid),
          );
        }
        return !filterIds.some((fid) => fid === rowId);
      default:
        return true;
    }
  }

  const rowIds = toArray(rowValue).map(idOf);
  switch (filter.condition.type) {
    case "includes":
      return filterIds.some((fid) => rowIds.includes(fid));
    case "includesAll":
      return filterIds.every((fid) => rowIds.includes(fid));
    case "excludes":
      return !filterIds.some((fid) => rowIds.includes(fid));
    case "excludesAll":
      return (
        rowIds.length > 0 && filterIds.every((fid) => !rowIds.includes(fid))
      );
    case "areAll":
      return rowIds.length > 0 && rowIds.every((rid) => rid === filterIds[0]);
    default:
      return true;
  }
};

const applyDate = (rowValue: unknown, filter: FilterBuilderValue): boolean => {
  const rawFilterDate = toDate(filter.value[0].value ?? filter.value[0].label);
  if (!rawFilterDate) return true;
  const isDate = filter.condition.dataType === "date";
  const filterT = (isDate ? startOfDay(rawFilterDate) : rawFilterDate).getTime();
  const isMulti = !!filter.condition.multipleValues;

  if (!isMulti) {
    const rawRowDate = toDate(rowValue);
    if (!rawRowDate) return true;
    const rowT = (isDate ? startOfDay(rawRowDate) : rawRowDate).getTime();
    switch (filter.condition.type) {
      case "equals":
        return rowT === filterT;
      case "before":
        return rowT < filterT;
      case "after":
        return rowT > filterT;
      default:
        return true;
    }
  }

  const times = toArray(rowValue)
    .map(toDate)
    .filter((d): d is Date => d !== null)
    .map((d) => (isDate ? startOfDay(d) : d).getTime());

  switch (filter.condition.type) {
    case "hasOneOn":
      return times.some((t) => t === filterT);
    case "hasOneBefore":
      return times.some((t) => t < filterT);
    case "hasOneAfter":
      return times.some((t) => t > filterT);
    case "allAreOn":
      return times.length > 0 && times.every((t) => t === filterT);
    case "allAreBefore":
      return times.length > 0 && times.every((t) => t < filterT);
    case "allAreAfter":
      return times.length > 0 && times.every((t) => t > filterT);
    default:
      return true;
  }
};

const applyNumber = (
  rowValue: unknown,
  filter: FilterBuilderValue,
): boolean => {
  const filterNum = Number(filter.value[0].value ?? filter.value[0].label);
  if (Number.isNaN(filterNum)) return true;
  const isMulti = !!filter.condition.multipleValues;

  if (!isMulti) {
    const rowNum = Number(rowValue);
    if (Number.isNaN(rowNum)) return true;
    switch (filter.condition.type) {
      case "equals":
        return rowNum === filterNum;
      case "greaterThan":
        return rowNum > filterNum;
      case "lessThan":
        return rowNum < filterNum;
      default:
        return true;
    }
  }

  const list = toArray(rowValue)
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));
  switch (filter.condition.type) {
    case "hasOneEqual":
      return list.some((n) => n === filterNum);
    case "hasOneGreaterThan":
      return list.some((n) => n > filterNum);
    case "hasOneLessThan":
      return list.some((n) => n < filterNum);
    case "allEqual":
      return list.length > 0 && list.every((n) => n === filterNum);
    case "allGreaterThan":
      return list.length > 0 && list.every((n) => n > filterNum);
    case "allLessThan":
      return list.length > 0 && list.every((n) => n < filterNum);
    default:
      return true;
  }
};

const applyBoolean = (
  rowValue: unknown,
  filter: FilterBuilderValue,
): boolean => {
  const filterBool = Boolean(filter.value[0].value);
  const isMulti = !!filter.condition.multipleValues;

  if (!isMulti) return Boolean(rowValue) === filterBool;

  const list = toArray(rowValue).map(Boolean);
  switch (filter.condition.type) {
    case "hasOneEqual":
      return list.some((b) => b === filterBool);
    case "allEqual":
      return list.length > 0 && list.every((b) => b === filterBool);
    default:
      return true;
  }
};

const passes = <TRow,>(row: TRow, filter: FilterBuilderValue): boolean => {
  if (!filter.value || filter.value.length === 0) return true;
  const rowValue = getNestedValue(row, filter.property);
  switch (filter.condition.dataType) {
    case "text":
      return applyText(rowValue, filter);
    case "select":
      return applySelect(rowValue, filter);
    case "date":
    case "dateTime":
      return applyDate(rowValue, filter);
    case "number":
      return applyNumber(rowValue, filter);
    case "boolean":
      return applyBoolean(rowValue, filter);
    default:
      return true;
  }
};

export const filterRows = <TRow,>(
  rows: TRow[],
  filters: FilterBuilderValue[],
): TRow[] => {
  if (filters.length === 0) return rows;
  return rows.filter((row) => filters.every((f) => passes(row, f)));
};

export const useFilteredRows = <TRow,>(
  rows: TRow[],
  filters: FilterBuilderValue[],
): TRow[] =>
  React.useMemo(() => filterRows(rows, filters), [rows, filters]);

export const EmployeeTable = ({
  rows,
  registry,
}: {
  rows: Employee[];
  registry: Parameters<typeof FilterBuilder>[0]["filters"];
}): React.ReactNode => {
  const [filters, setFilters] = React.useState<FilterBuilderValue[]>([]);
  const visible = useFilteredRows(rows, filters);

  return (
    <>
      <FilterBuilder filters={registry} value={filters} onChange={setFilters} />
      <ul>
        {visible.map((emp) => (
          <li key={emp.id}>{emp.name}</li>
        ))}
      </ul>
    </>
  );
};
