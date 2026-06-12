import {
  sql,
  type ExpressionBuilder,
  type ExpressionWrapper,
  type SqlBool,
} from "kysely";

import type { DB } from "../schemas/kysely.ts";
import type { FilterBuilderValue } from "../shared.ts";

type Cond = ExpressionWrapper<DB, "employees", SqlBool>;
type EB = ExpressionBuilder<DB, "employees">;

export function buildWhere(filters: FilterBuilderValue[]) {
  return (eb: EB) => {
    const conds = filters
      .map((f) => toCondition(eb, f))
      .filter((c): c is Cond => c !== undefined);
    return eb.and(conds);
  };
}

function toCondition(eb: EB, f: FilterBuilderValue): Cond | undefined {
  switch (f.condition.dataType) {
    case "text":     return textCondition(eb, f);
    case "number":   return numberCondition(eb, f);
    case "date":
    case "dateTime": return dateCondition(eb, f);
    case "boolean":  return booleanCondition(eb, f);
    case "select":   return selectCondition(eb, f);
  }
}

function textCondition(eb: EB, f: FilterBuilderValue): Cond | undefined {
  const col = f.property as keyof DB["employees"];
  const needle = String(f.value[0]?.value ?? f.value[0]?.label ?? "");
  const pattern = `%${needle}%`;

  switch (f.condition.type) {
    case "contains":            return eb(col, "like", pattern as never);
    case "notContains":         return eb(col, "not like", pattern as never);
    case "hasOneContaining":    return jsonEach(eb, col, sql`value LIKE ${pattern}`);
    case "hasOneNotContaining": return jsonEach(eb, col, sql`value NOT LIKE ${pattern}`);
    case "allContain":          return jsonAll(eb, col, sql`value LIKE ${pattern}`);
    case "noneContain":         return jsonNone(eb, col, sql`value LIKE ${pattern}`);
  }
}

function numberCondition(eb: EB, f: FilterBuilderValue): Cond | undefined {
  const col = f.property as keyof DB["employees"];
  const n = Number(f.value[0]?.value ?? f.value[0]?.label);
  if (Number.isNaN(n)) return undefined;

  switch (f.condition.type) {
    case "equals":            return eb(col, "=", n as never);
    case "greaterThan":       return eb(col, ">", n as never);
    case "lessThan":          return eb(col, "<", n as never);
    case "hasOneEqual":       return jsonEach(eb, col, sql`value = ${n}`);
    case "hasOneGreaterThan": return jsonEach(eb, col, sql`value > ${n}`);
    case "hasOneLessThan":    return jsonEach(eb, col, sql`value < ${n}`);
    case "allEqual":          return jsonAll(eb, col, sql`value = ${n}`);
    case "allGreaterThan":    return jsonAll(eb, col, sql`value > ${n}`);
    case "allLessThan":       return jsonAll(eb, col, sql`value < ${n}`);
  }
}

function dateCondition(eb: EB, f: FilterBuilderValue): Cond | undefined {
  const col = f.property as keyof DB["employees"];
  const raw = f.value[0]?.value ?? f.value[0]?.label;
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) return undefined;
  const iso = d.toISOString();

  switch (f.condition.type) {
    case "equals":       return eb(col, "=", iso as never);
    case "before":       return eb(col, "<", iso as never);
    case "after":        return eb(col, ">", iso as never);
    case "hasOneOn":     return jsonEach(eb, col, sql`value = ${iso}`);
    case "hasOneBefore": return jsonEach(eb, col, sql`value < ${iso}`);
    case "hasOneAfter":  return jsonEach(eb, col, sql`value > ${iso}`);
    case "allAreOn":     return jsonAll(eb, col, sql`value = ${iso}`);
    case "allAreBefore": return jsonAll(eb, col, sql`value < ${iso}`);
    case "allAreAfter":  return jsonAll(eb, col, sql`value > ${iso}`);
  }
}

function booleanCondition(eb: EB, f: FilterBuilderValue): Cond | undefined {
  const col = f.property as keyof DB["employees"];
  const b = Boolean(f.value[0]?.value);

  switch (f.condition.type) {
    case "equals":      return eb(col, "=", (b ? 1 : 0) as never);
    case "hasOneEqual": return jsonEach(eb, col, sql`value = ${b ? 1 : 0}`);
    case "allEqual":    return jsonAll(eb, col, sql`value = ${b ? 1 : 0}`);
  }
}

function selectCondition(eb: EB, f: FilterBuilderValue): Cond | undefined {
  const isJunction = f.property === "skills";
  const ids = f.value
    .map((opt) => idOf(opt.value))
    .filter((id): id is string => typeof id === "string");
  if (ids.length === 0) return undefined;

  if (!isJunction) {
    const col = (
      f.property === "department" ? "department_id" : f.property
    ) as keyof DB["employees"];

    switch (f.condition.type) {
      case "equals":    return eb(col, "=", ids[0] as never);
      case "notEquals": return eb(col, "<>", ids[0] as never);
      case "anyOf":     return eb(col, "in", ids as never);
      case "noneOf":    return eb(col, "not in", ids as never);
    }
    return undefined;
  }

  const has = eb.exists(
    eb
      .selectFrom("employee_skills as es")
      .select(sql<number>`1`.as("one"))
      .whereRef("es.employee_id", "=", "employees.id")
      .where("es.skill_id", "in", ids),
  );

  switch (f.condition.type) {
    case "includes":    return has;
    case "excludes":    return eb.not(has);
    case "excludesAll": return eb.not(has);
    case "includesAll":
      return eb(
        eb
          .selectFrom("employee_skills as es")
          .select(({ fn }) =>
            fn.count<number>("es.skill_id").distinct().as("c"),
          )
          .whereRef("es.employee_id", "=", "employees.id")
          .where("es.skill_id", "in", ids),
        "=",
        ids.length,
      );
    case "areAll":
      return eb.not(
        eb.exists(
          eb
            .selectFrom("employee_skills as es")
            .select(sql<number>`1`.as("one"))
            .whereRef("es.employee_id", "=", "employees.id")
            .where("es.skill_id", "<>", ids[0]),
        ),
      );
  }
}

const jsonEach = (eb: EB, col: keyof DB["employees"], pred: ReturnType<typeof sql>): Cond =>
  eb(sql<SqlBool>`EXISTS (SELECT 1 FROM json_each(${sql.ref(col)}) WHERE ${pred})`, "=", true as never);

const jsonAll = (eb: EB, col: keyof DB["employees"], pred: ReturnType<typeof sql>): Cond =>
  eb(
    sql<SqlBool>`json_array_length(${sql.ref(col)}) > 0 AND NOT EXISTS (
      SELECT 1 FROM json_each(${sql.ref(col)}) WHERE NOT (${pred})
    )`,
    "=",
    true as never,
  );

const jsonNone = (eb: EB, col: keyof DB["employees"], pred: ReturnType<typeof sql>): Cond =>
  eb(sql<SqlBool>`NOT EXISTS (SELECT 1 FROM json_each(${sql.ref(col)}) WHERE ${pred})`, "=", true as never);

function idOf(maybe: unknown): unknown {
  return maybe && typeof maybe === "object" && "id" in maybe
    ? (maybe as { id: unknown }).id
    : maybe;
}
