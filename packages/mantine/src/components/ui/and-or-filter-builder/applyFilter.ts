/**
 * Matching / query-string helpers — import these into your table.
 * Evaluation is a plain left-to-right fold (no operator precedence).
 * Comparisons are type-aware: which fields are compared as numbers/dates/
 * booleans vs. plain text is driven by each field's `FieldDef.type`.
 */

import {
  fieldByName,
  operatorLabel,
  operatorNeedsValue,
  type Condition,
  type FieldDef,
  type FilterGroup,
  type FilterQuery,
} from "./types";

function isEmptyValue(raw: unknown): boolean {
  if (raw === null || raw === undefined) return true;
  if (typeof raw === "string") return raw.trim() === "";
  return false;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function matchOne(row: Record<string, unknown>, c: Condition, field: FieldDef | undefined): boolean {
  const raw = row[c.field];
  if (c.op === "empty") return isEmptyValue(raw);
  if (c.op === "notEmpty") return !isEmptyValue(raw);

  const value = c.values[0] ?? "";

  switch (field?.type) {
    case "number": {
      const n = Number(raw);
      const q = Number(value);
      if (Number.isNaN(n) || Number.isNaN(q)) return false;
      if (c.op === "greaterThan") return n > q;
      if (c.op === "lessThan") return n < q;
      return n === q;
    }
    case "date": {
      const d = raw instanceof Date ? raw : new Date(String(raw ?? ""));
      const q = new Date(value);
      if (Number.isNaN(d.getTime()) || Number.isNaN(q.getTime())) return false;
      const [dDay, qDay] = [startOfDay(d), startOfDay(q)];
      if (c.op === "before") return dDay < qDay;
      if (c.op === "after") return dDay > qDay;
      return dDay === qDay;
    }
    case "boolean": {
      return Boolean(raw) === (value === "true");
    }
    case "select": {
      const val = String(raw ?? "");
      if (c.op === "anyOf") return c.values.includes(val);
      if (c.op === "noneOf") return !c.values.includes(val);
      return c.op === "notEquals" ? val !== value : val === value;
    }
    default: {
      const val = String(raw ?? "").toLowerCase();
      const q = value.toLowerCase();
      switch (c.op) {
        case "notContains":
          return !val.includes(q);
        case "equals":
          return val === q;
        case "startsWith":
          return val.startsWith(q);
        default:
          return val.includes(q);
      }
    }
  }
}

function matchGroup(row: Record<string, unknown>, g: FilterGroup, fields: FieldDef[]): boolean {
  if (g.conditions.length === 0) return true;
  return g.conditions.reduce<boolean>((acc, c, i) => {
    const r = matchOne(row, c, fieldByName(fields, c.field));
    if (i === 0) return r;
    return g.joins[i - 1] === "OR" ? acc || r : acc && r;
  }, true);
}

/** Does a row satisfy the whole query? */
export function matchQuery(
  row: Record<string, unknown>,
  query: FilterQuery,
  fields: FieldDef[],
): boolean {
  const active = query.groups.filter((g) => g.conditions.length > 0);
  if (active.length === 0) return true;
  return active.reduce<boolean>((acc, g, i) => {
    const gm = matchGroup(row, g, fields);
    if (i === 0) return gm;
    return query.joins[i - 1] === "OR" ? acc || gm : acc && gm;
  }, true);
}

/** Human-readable label for one raw value, e.g. a boolean "true" → "Yes", a select value → its option label. */
export function describeOneValue(field: FieldDef | undefined, value: string): string {
  if (field?.type === "boolean") return value === "true" ? "Yes" : "No";
  if (field?.type === "select") return field.options?.find((o) => o.value === value)?.label ?? value;
  if (field?.type === "date") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
  }
  return value;
}

/** Human-readable label per selected value — one entry per value (see {@link describeOneValue}). */
export function describeValues(field: FieldDef | undefined, values: string[]): string[] {
  return values.map((v) => describeOneValue(field, v));
}

/** Human-readable, comma-joined value for previews, e.g. "Engineering, Design". */
export function describeValue(field: FieldDef | undefined, values: string[]): string {
  return describeValues(field, values).join(", ");
}

/** Human-readable preview, e.g.  (City contains "London" AND Company contains "UCL") OR Position starts with "Analyst" */
export function buildQueryString(query: FilterQuery, fields: FieldDef[]): string {
  const labelOf = (v: string) => fieldByName(fields, v)?.label ?? v;
  const active = query.groups.filter((g) => g.conditions.length > 0);
  if (active.length === 0) return "";
  const parts = active.map((g) => {
    const inner = g.conditions
      .map((c, ci) => {
        const field = fieldByName(fields, c.field);
        const quote = (field?.type ?? "text") === "text";
        const described = describeValue(field, c.values);
        const v = operatorNeedsValue(field, c.op)
          ? quote
            ? ` "${described}"`
            : ` ${described}`
          : "";
        const prefix = ci > 0 ? `${g.joins[ci - 1]} ` : "";
        return `${prefix}${labelOf(c.field)} ${operatorLabel(field, c.op)}${v}`;
      })
      .join(" ");
    return g.conditions.length > 1 ? `(${inner})` : inner;
  });
  return parts
    .map((part, i) => (i > 0 ? `${query.joins[i - 1]} ${part}` : part))
    .join(" ");
}
