import type { estypes } from "@elastic/elasticsearch";

import type { FilterBuilderValue } from "../shared.ts";

type Q = estypes.QueryDslQueryContainer;
type Bool = { must: Q[]; must_not: Q[] };

const SCRIPT_SAFE_FIELDS = new Set([
  "aliases",
  "quarterlyScores",
  "performanceReviewDates",
  "shiftStarts",
  "skillIds",
]);

export function buildQuery(filters: FilterBuilderValue[]): {
  query: Q;
} {
  const must: Q[] = [];
  const must_not: Q[] = [];
  const ctx: Bool = { must, must_not };

  for (const f of filters) {
    appendCondition(ctx, f);
  }

  return { query: { bool: { must, must_not } } };
}

function appendCondition(ctx: Bool, f: FilterBuilderValue): void {
  switch (f.condition.dataType) {
    case "text":     textCondition(ctx, f); return;
    case "number":   numberCondition(ctx, f); return;
    case "date":
    case "dateTime": dateCondition(ctx, f); return;
    case "boolean":  booleanCondition(ctx, f); return;
    case "select":   selectCondition(ctx, f); return;
  }
}

function textCondition(ctx: Bool, f: FilterBuilderValue): void {
  const key = f.property;
  const v = String(f.value[0]?.value ?? f.value[0]?.label ?? "");
  const m: Q = { match: { [key]: v } };

  switch (f.condition.type) {
    case "contains":            ctx.must.push(m); return;
    case "notContains":         ctx.must_not.push(m); return;
    case "hasOneContaining":    ctx.must.push(m); return;
    case "hasOneNotContaining":
      ctx.must_not.push({ match: { [key]: { query: v, operator: "and" } } });
      return;
    case "allContain":
      ctx.must.push({ match: { [key]: { query: v, operator: "and" } } });
      return;
    case "noneContain":         ctx.must_not.push(m); return;
  }
}

function numberCondition(ctx: Bool, f: FilterBuilderValue): void {
  const key = f.property;
  const n = Number(f.value[0]?.value ?? f.value[0]?.label);
  if (Number.isNaN(n)) return;

  switch (f.condition.type) {
    case "equals":            ctx.must.push({ term: { [key]: n } }); return;
    case "greaterThan":       ctx.must.push({ range: { [key]: { gt: n } } }); return;
    case "lessThan":          ctx.must.push({ range: { [key]: { lt: n } } }); return;
    case "hasOneEqual":       ctx.must.push({ term: { [key]: n } }); return;
    case "hasOneGreaterThan": ctx.must.push({ range: { [key]: { gt: n } } }); return;
    case "hasOneLessThan":    ctx.must.push({ range: { [key]: { lt: n } } }); return;
    case "allEqual":          ctx.must.push(scriptAll(key, "==", n)); return;
    case "allGreaterThan":    ctx.must.push(scriptAll(key, ">", n)); return;
    case "allLessThan":       ctx.must.push(scriptAll(key, "<", n)); return;
  }
}

function dateCondition(ctx: Bool, f: FilterBuilderValue): void {
  const key = f.property;
  const raw = f.value[0]?.value ?? f.value[0]?.label;
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) return;
  const iso = d.toISOString();

  switch (f.condition.type) {
    case "equals":       ctx.must.push({ term: { [key]: iso } }); return;
    case "before":       ctx.must.push({ range: { [key]: { lt: iso } } }); return;
    case "after":        ctx.must.push({ range: { [key]: { gt: iso } } }); return;
    case "hasOneOn":     ctx.must.push({ term: { [key]: iso } }); return;
    case "hasOneBefore": ctx.must.push({ range: { [key]: { lt: iso } } }); return;
    case "hasOneAfter":  ctx.must.push({ range: { [key]: { gt: iso } } }); return;
    case "allAreOn":     ctx.must.push(scriptAll(key, "==", iso, "ZonedDateTime")); return;
    case "allAreBefore": ctx.must.push(scriptAll(key, "<", iso, "ZonedDateTime")); return;
    case "allAreAfter":  ctx.must.push(scriptAll(key, ">", iso, "ZonedDateTime")); return;
  }
}

function booleanCondition(ctx: Bool, f: FilterBuilderValue): void {
  const key = f.property;
  const b = Boolean(f.value[0]?.value);

  switch (f.condition.type) {
    case "equals":      ctx.must.push({ term: { [key]: b } }); return;
    case "hasOneEqual": ctx.must.push({ term: { [key]: b } }); return;
    case "allEqual":    ctx.must.push(scriptAll(key, "==", b)); return;
  }
}

function selectCondition(ctx: Bool, f: FilterBuilderValue): void {
  const ids = f.value
    .map((opt) => idOf(opt.value))
    .filter((id): id is string => typeof id === "string");
  if (ids.length === 0) return;

  const isJunction = f.property === "skills";
  const key = isJunction
    ? "skillIds"
    : f.property === "department"
      ? "departmentId"
      : f.property;

  switch (f.condition.type) {
    case "equals":    ctx.must.push({ term: { [key]: ids[0] } }); return;
    case "notEquals": ctx.must_not.push({ term: { [key]: ids[0] } }); return;
    case "anyOf":     ctx.must.push({ terms: { [key]: ids } }); return;
    case "noneOf":    ctx.must_not.push({ terms: { [key]: ids } }); return;
    case "includes":  ctx.must.push({ terms: { [key]: ids } }); return;
    case "excludes":  ctx.must_not.push({ terms: { [key]: ids } }); return;
    case "includesAll":
      for (const id of ids) ctx.must.push({ term: { [key]: id } });
      return;
    case "excludesAll": ctx.must_not.push({ terms: { [key]: ids } }); return;
    case "areAll":      ctx.must.push(scriptAll(key, "==", ids[0])); return;
  }
}

function scriptAll(
  field: string,
  op: "==" | "<" | ">",
  value: unknown,
  cast?: string,
): Q {
  if (!SCRIPT_SAFE_FIELDS.has(field)) {
    throw new Error(
      `Refusing to build a script query for unknown field "${field}". ` +
        `Add it to SCRIPT_SAFE_FIELDS only after confirming it is a list/array mapping.`,
    );
  }
  const valueExpr = cast ? `${cast}.parse(params.v)` : "params.v";
  return {
    script: {
      script: {
        source: `for (def x : doc['${field}']) { if (!(x ${op} ${valueExpr})) return false; } return true;`,
        params: { v: value },
      },
    },
  };
}

function idOf(maybe: unknown): unknown {
  return maybe && typeof maybe === "object" && "id" in maybe
    ? (maybe as { id: unknown }).id
    : maybe;
}
