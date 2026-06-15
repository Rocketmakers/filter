import {
  and,
  eq,
  getTableColumns,
  gt,
  inArray,
  like,
  lt,
  ne,
  notInArray,
  notLike,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";

import { employees, employeeSkills } from "../schemas/drizzle.ts";
import type { FilterBuilderValue } from "../shared.ts";

const columns = getTableColumns(employees);
type EmployeeColumn = keyof typeof columns;

export function buildWhere(filters: FilterBuilderValue[]): SQL | undefined {
  const conds = filters
    .map(toCondition)
    .filter((c): c is SQL => c !== undefined);
  return conds.length ? and(...conds) : undefined;
}

function toCondition(f: FilterBuilderValue): SQL | undefined {
  switch (f.condition.dataType) {
    case "text":     return textCondition(f);
    case "number":   return numberCondition(f);
    case "date":
    case "dateTime": return dateCondition(f);
    case "boolean":  return booleanCondition(f);
    case "select":   return selectCondition(f);
  }
}

function textCondition(f: FilterBuilderValue): SQL | undefined {
  const col = columns[f.property as EmployeeColumn] as AnyColumn | undefined;
  if (!col) return undefined;
  const needle = String(f.value[0]?.value ?? f.value[0]?.label ?? "");
  const pattern = `%${needle}%`;

  switch (f.condition.type) {
    case "contains":            return like(col, pattern);
    case "notContains":         return notLike(col, pattern);
    case "hasOneContaining":    return jsonEach(col, sql`value LIKE ${pattern}`);
    case "hasOneNotContaining": return jsonEach(col, sql`value NOT LIKE ${pattern}`);
    case "allContain":          return jsonAll(col, sql`value LIKE ${pattern}`);
    case "noneContain":         return jsonNone(col, sql`value LIKE ${pattern}`);
  }
}

function numberCondition(f: FilterBuilderValue): SQL | undefined {
  const col = columns[f.property as EmployeeColumn] as AnyColumn | undefined;
  if (!col) return undefined;
  const n = Number(f.value[0]?.value ?? f.value[0]?.label);
  if (Number.isNaN(n)) return undefined;

  switch (f.condition.type) {
    case "equals":            return eq(col, n);
    case "greaterThan":       return gt(col, n);
    case "lessThan":          return lt(col, n);
    case "hasOneEqual":       return jsonEach(col, sql`value = ${n}`);
    case "hasOneGreaterThan": return jsonEach(col, sql`value > ${n}`);
    case "hasOneLessThan":    return jsonEach(col, sql`value < ${n}`);
    case "allEqual":          return jsonAll(col, sql`value = ${n}`);
    case "allGreaterThan":    return jsonAll(col, sql`value > ${n}`);
    case "allLessThan":       return jsonAll(col, sql`value < ${n}`);
  }
}

function dateCondition(f: FilterBuilderValue): SQL | undefined {
  const col = columns[f.property as EmployeeColumn] as AnyColumn | undefined;
  if (!col) return undefined;
  const raw = f.value[0]?.value ?? f.value[0]?.label;
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) return undefined;

  switch (f.condition.type) {
    case "equals":       return eq(col, d);
    case "before":       return lt(col, d);
    case "after":        return gt(col, d);
    case "hasOneOn":     return jsonEach(col, sql`value = ${d.toISOString()}`);
    case "hasOneBefore": return jsonEach(col, sql`value < ${d.toISOString()}`);
    case "hasOneAfter":  return jsonEach(col, sql`value > ${d.toISOString()}`);
    case "allAreOn":     return jsonAll(col, sql`value = ${d.toISOString()}`);
    case "allAreBefore": return jsonAll(col, sql`value < ${d.toISOString()}`);
    case "allAreAfter":  return jsonAll(col, sql`value > ${d.toISOString()}`);
  }
}

function booleanCondition(f: FilterBuilderValue): SQL | undefined {
  const col = columns[f.property as EmployeeColumn] as AnyColumn | undefined;
  if (!col) return undefined;
  const b = Boolean(f.value[0]?.value);

  switch (f.condition.type) {
    case "equals":      return eq(col, b);
    case "hasOneEqual": return jsonEach(col, sql`value = ${b ? 1 : 0}`);
    case "allEqual":    return jsonAll(col, sql`value = ${b ? 1 : 0}`);
  }
}

function selectCondition(f: FilterBuilderValue): SQL | undefined {
  const isJunction = f.property === "skills";
  const ids = f.value
    .map((opt) => idOf(opt.value))
    .filter((id): id is string => typeof id === "string");
  if (ids.length === 0) return undefined;

  if (!isJunction) {
    const colName =
      f.property === "department"
        ? ("departmentId" as EmployeeColumn)
        : (f.property as EmployeeColumn);
    const col = columns[colName] as AnyColumn | undefined;
    if (!col) return undefined;

    switch (f.condition.type) {
      case "equals":    return eq(col, ids[0]);
      case "notEquals": return ne(col, ids[0]);
      case "anyOf":     return inArray(col, ids);
      case "noneOf":    return notInArray(col, ids);
    }
    return undefined;
  }

  const has = sql`EXISTS (
    SELECT 1 FROM ${employeeSkills}
    WHERE ${employeeSkills.employeeId} = ${employees.id}
      AND ${employeeSkills.skillId} IN ${ids}
  )`;
  const hasNone = sql`NOT ${has}`;

  switch (f.condition.type) {
    case "includes":    return has;
    case "excludes":    return hasNone;
    case "excludesAll": return hasNone;
    case "includesAll":
      return sql`(
        SELECT COUNT(DISTINCT ${employeeSkills.skillId})
        FROM ${employeeSkills}
        WHERE ${employeeSkills.employeeId} = ${employees.id}
          AND ${employeeSkills.skillId} IN ${ids}
      ) = ${ids.length}`;
    case "areAll":
      return sql`NOT EXISTS (
        SELECT 1 FROM ${employeeSkills}
        WHERE ${employeeSkills.employeeId} = ${employees.id}
          AND ${employeeSkills.skillId} <> ${ids[0]}
      )`;
  }
}

const jsonEach = (col: AnyColumn, pred: SQL) =>
  sql`EXISTS (SELECT 1 FROM json_each(${col}) WHERE ${pred})`;

const jsonAll = (col: AnyColumn, pred: SQL) =>
  sql`json_array_length(${col}) > 0 AND NOT EXISTS (
    SELECT 1 FROM json_each(${col}) WHERE NOT (${pred})
  )`;

const jsonNone = (col: AnyColumn, pred: SQL) =>
  sql`NOT EXISTS (SELECT 1 FROM json_each(${col}) WHERE ${pred})`;

const hasId = (v: unknown): v is { id: unknown } =>
  typeof v === "object" && v !== null && "id" in v;

const idOf = (v: unknown): unknown => (hasId(v) ? v.id : v);
