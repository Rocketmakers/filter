import type { Prisma } from "@prisma/client";

import type { FilterBuilderValue } from "../shared.ts";

type Where = Prisma.EmployeeWhereInput;

export function buildWhere(filters: FilterBuilderValue[]): Where {
  const AND = filters
    .map(toCondition)
    .filter((w): w is Where => w !== undefined);
  return AND.length ? { AND } : {};
}

function toCondition(f: FilterBuilderValue): Where | undefined {
  switch (f.condition.dataType) {
    case "text":     return textCondition(f);
    case "number":   return numberCondition(f);
    case "date":
    case "dateTime": return dateCondition(f);
    case "boolean":  return booleanCondition(f);
    case "select":   return selectCondition(f);
  }
}

function textCondition(f: FilterBuilderValue): Where | undefined {
  const key = f.property as keyof Where;
  const v = String(f.value[0]?.value ?? f.value[0]?.label ?? "");

  switch (f.condition.type) {
    case "contains":
      return { [key]: { contains: v, mode: "insensitive" } } as Where;
    case "notContains":
      return {
        NOT: { [key]: { contains: v, mode: "insensitive" } },
      } as Where;
    case "hasOneContaining":
      return { [key]: { has: v } } as Where;
    case "hasOneNotContaining":
      return { NOT: { [key]: { has: v } } } as Where;
    case "allContain":
      return { [key]: { hasEvery: [v] } } as Where;
    case "noneContain":
      return { [key]: { isEmpty: false }, NOT: { [key]: { has: v } } } as Where;
  }
}

function numberCondition(f: FilterBuilderValue): Where | undefined {
  const key = f.property as keyof Where;
  const n = Number(f.value[0]?.value ?? f.value[0]?.label);
  if (Number.isNaN(n)) return undefined;

  switch (f.condition.type) {
    case "equals":            return { [key]: { equals: n } } as Where;
    case "greaterThan":       return { [key]: { gt: n } } as Where;
    case "lessThan":          return { [key]: { lt: n } } as Where;
    case "hasOneEqual":       return { [key]: { has: n } } as Where;
    case "hasOneGreaterThan": return { [key]: { hasSome: [n] } } as Where;
    case "hasOneLessThan":    return { [key]: { hasSome: [n] } } as Where;
    case "allEqual":          return { [key]: { hasEvery: [n] } } as Where;
    case "allGreaterThan":    return { [key]: { hasEvery: [n] } } as Where;
    case "allLessThan":       return { [key]: { hasEvery: [n] } } as Where;
  }
}

function dateCondition(f: FilterBuilderValue): Where | undefined {
  const key = f.property as keyof Where;
  const raw = f.value[0]?.value ?? f.value[0]?.label;
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) return undefined;

  switch (f.condition.type) {
    case "equals":       return { [key]: { equals: d } } as Where;
    case "before":       return { [key]: { lt: d } } as Where;
    case "after":        return { [key]: { gt: d } } as Where;
    case "hasOneOn":     return { [key]: { has: d } } as Where;
    case "hasOneBefore": return { [key]: { hasSome: [d] } } as Where;
    case "hasOneAfter":  return { [key]: { hasSome: [d] } } as Where;
    case "allAreOn":     return { [key]: { hasEvery: [d] } } as Where;
    case "allAreBefore": return { [key]: { hasEvery: [d] } } as Where;
    case "allAreAfter":  return { [key]: { hasEvery: [d] } } as Where;
  }
}

function booleanCondition(f: FilterBuilderValue): Where | undefined {
  const key = f.property as keyof Where;
  const b = Boolean(f.value[0]?.value);

  switch (f.condition.type) {
    case "equals":      return { [key]: { equals: b } } as Where;
    case "hasOneEqual": return { [key]: { has: b } } as Where;
    case "allEqual":    return { [key]: { hasEvery: [b] } } as Where;
  }
}

function selectCondition(f: FilterBuilderValue): Where | undefined {
  const ids = f.value
    .map((opt) => idOf(opt.value))
    .filter((id): id is string => typeof id === "string");
  if (ids.length === 0) return undefined;

  if (f.property === "department") {
    switch (f.condition.type) {
      case "equals":    return { departmentId: ids[0] };
      case "notEquals": return { NOT: { departmentId: ids[0] } };
      case "anyOf":     return { departmentId: { in: ids } };
      case "noneOf":    return { departmentId: { notIn: ids } };
    }
    return undefined;
  }

  if (f.property === "skills") {
    switch (f.condition.type) {
      case "includes":
        return { skills: { some: { id: { in: ids } } } };
      case "excludes":
        return { skills: { none: { id: { in: ids } } } };
      case "excludesAll":
        return { skills: { none: { id: { in: ids } } } };
      case "includesAll":
        return {
          AND: ids.map((id) => ({
            skills: { some: { id } },
          })),
        };
      case "areAll":
        return { skills: { every: { id: ids[0] } } };
    }
    return undefined;
  }
}

const hasId = (v: unknown): v is { id: unknown } =>
  typeof v === "object" && v !== null && "id" in v;

const idOf = (v: unknown): unknown => (hasId(v) ? v.id : v);
