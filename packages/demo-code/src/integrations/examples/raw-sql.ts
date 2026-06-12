import type { FilterBuilderValue } from "../shared.ts";

const SCALAR_COLUMNS = new Set([
  "name",
  "email",
  "role",
  "salary",
  "hire_date",
  "last_login",
  "is_active",
  "department_id",
]);

const JSON_ARRAY_COLUMNS = new Set([
  "aliases",
  "quarterly_scores",
  "performance_review_dates",
  "shift_starts",
]);

type Bind = { sql: string; params: unknown[] };

const SAFE = (col: string) =>
  SCALAR_COLUMNS.has(col) || JSON_ARRAY_COLUMNS.has(col) || col === "skills";

const placeholders = (n: number) => Array(n).fill("?").join(",");

export function buildWhere(filters: FilterBuilderValue[]): Bind {
  const clauses: string[] = [];
  const params: unknown[] = [];

  for (const f of filters) {
    if (!SAFE(f.property)) continue;
    const part = clauseFor(f);
    if (!part) continue;
    clauses.push(`(${part.sql})`);
    params.push(...part.params);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function clauseFor(f: FilterBuilderValue): Bind | undefined {
  switch (f.condition.dataType) {
    case "text":     return textClause(f);
    case "number":   return numberClause(f);
    case "date":
    case "dateTime": return dateClause(f);
    case "boolean":  return booleanClause(f);
    case "select":   return selectClause(f);
  }
}

function textClause(f: FilterBuilderValue): Bind | undefined {
  const col = f.property;
  const needle = String(f.value[0]?.value ?? f.value[0]?.label ?? "");
  const like = `%${needle}%`;

  switch (f.condition.type) {
    case "contains":    return { sql: `${col} LIKE ?`, params: [like] };
    case "notContains": return { sql: `${col} NOT LIKE ?`, params: [like] };
    case "hasOneContaining":
      return jsonEach(col, "value LIKE ?", [like]);
    case "hasOneNotContaining":
      return jsonEach(col, "value NOT LIKE ?", [like]);
    case "allContain":
      return jsonNotExists(col, "value NOT LIKE ?", [like]);
    case "noneContain":
      return jsonNotExists(col, "value LIKE ?", [like]);
  }
}

function numberClause(f: FilterBuilderValue): Bind | undefined {
  const col = f.property;
  const n = Number(f.value[0]?.value ?? f.value[0]?.label);
  if (Number.isNaN(n)) return undefined;

  switch (f.condition.type) {
    case "equals":       return { sql: `${col} = ?`, params: [n] };
    case "greaterThan":  return { sql: `${col} > ?`, params: [n] };
    case "lessThan":     return { sql: `${col} < ?`, params: [n] };
    case "hasOneEqual":         return jsonEach(col, "value = ?", [n]);
    case "hasOneGreaterThan":   return jsonEach(col, "value > ?", [n]);
    case "hasOneLessThan":      return jsonEach(col, "value < ?", [n]);
    case "allEqual":            return jsonNotExists(col, "value <> ?", [n]);
    case "allGreaterThan":      return jsonNotExists(col, "value <= ?", [n]);
    case "allLessThan":         return jsonNotExists(col, "value >= ?", [n]);
  }
}

function dateClause(f: FilterBuilderValue): Bind | undefined {
  const col = f.property;
  const raw = f.value[0]?.value ?? f.value[0]?.label;
  const iso =
    raw instanceof Date ? raw.toISOString() : new Date(String(raw)).toISOString();

  switch (f.condition.type) {
    case "equals":  return { sql: `${col} = ?`, params: [iso] };
    case "before":  return { sql: `${col} < ?`, params: [iso] };
    case "after":   return { sql: `${col} > ?`, params: [iso] };
    case "hasOneOn":     return jsonEach(col, "value = ?", [iso]);
    case "hasOneBefore": return jsonEach(col, "value < ?", [iso]);
    case "hasOneAfter":  return jsonEach(col, "value > ?", [iso]);
    case "allAreOn":     return jsonNotExists(col, "value <> ?", [iso]);
    case "allAreBefore": return jsonNotExists(col, "value >= ?", [iso]);
    case "allAreAfter":  return jsonNotExists(col, "value <= ?", [iso]);
  }
}

function booleanClause(f: FilterBuilderValue): Bind | undefined {
  const col = f.property;
  const b = f.value[0]?.value ? 1 : 0;

  switch (f.condition.type) {
    case "equals":       return { sql: `${col} = ?`, params: [b] };
    case "hasOneEqual":  return jsonEach(col, "value = ?", [b]);
    case "allEqual":     return jsonNotExists(col, "value <> ?", [b]);
  }
}

function selectClause(f: FilterBuilderValue): Bind | undefined {
  const isJunction = f.property === "skills";
  const ids = f.value
    .map((opt) => idOf(opt.value))
    .filter((id) => id !== undefined);
  if (ids.length === 0) return undefined;

  if (!isJunction) {
    const col = f.property === "department" ? "department_id" : f.property;
    switch (f.condition.type) {
      case "equals":    return { sql: `${col} = ?`, params: [ids[0]] };
      case "notEquals": return { sql: `${col} <> ?`, params: [ids[0]] };
      case "anyOf":     return { sql: `${col} IN (${placeholders(ids.length)})`, params: ids };
      case "noneOf":    return { sql: `${col} NOT IN (${placeholders(ids.length)})`, params: ids };
    }
    return undefined;
  }

  const inList = placeholders(ids.length);
  const exists = (negate: boolean) =>
    `${negate ? "NOT " : ""}EXISTS (
      SELECT 1 FROM employee_skills es
      WHERE es.employee_id = employees.id AND es.skill_id IN (${inList})
    )`;

  switch (f.condition.type) {
    case "includes": return { sql: exists(false), params: ids };
    case "excludes": return { sql: exists(true), params: ids };
    case "includesAll":
      return {
        sql: `(
          SELECT COUNT(DISTINCT skill_id) FROM employee_skills
          WHERE employee_id = employees.id AND skill_id IN (${inList})
        ) = ?`,
        params: [...ids, ids.length],
      };
    case "excludesAll":
      return { sql: exists(true), params: ids };
    case "areAll":
      return {
        sql: `NOT EXISTS (
          SELECT 1 FROM employee_skills
          WHERE employee_id = employees.id AND skill_id <> ?
        )`,
        params: [ids[0]],
      };
  }
}

function jsonEach(col: string, predicate: string, params: unknown[]): Bind {
  return {
    sql: `EXISTS (SELECT 1 FROM json_each(${col}) WHERE ${predicate})`,
    params,
  };
}

function jsonNotExists(col: string, predicate: string, params: unknown[]): Bind {
  return {
    sql: `json_array_length(${col}) > 0 AND NOT EXISTS (
      SELECT 1 FROM json_each(${col}) WHERE ${predicate}
    )`,
    params,
  };
}

function idOf(maybe: unknown): unknown {
  return maybe && typeof maybe === "object" && "id" in maybe
    ? (maybe as { id: unknown }).id
    : maybe;
}
