import type { FilterQuery } from "mongoose";

import { Employee, type IEmployee } from "../schemas/mongoose.ts";
import type { FilterBuilderValue } from "../shared.ts";

type Q = FilterQuery<IEmployee>;

export function buildQuery(filters: FilterBuilderValue[]): Q {
  const $and = filters
    .map(toCondition)
    .filter((q): q is Q => q !== undefined);
  return $and.length ? { $and } : {};
}

function toCondition(f: FilterBuilderValue): Q | undefined {
  switch (f.condition.dataType) {
    case "text":     return textCondition(f);
    case "number":   return numberCondition(f);
    case "date":
    case "dateTime": return dateCondition(f);
    case "boolean":  return booleanCondition(f);
    case "select":   return selectCondition(f);
  }
}

function textCondition(f: FilterBuilderValue): Q | undefined {
  const key = f.property;
  const v = String(f.value[0]?.value ?? f.value[0]?.label ?? "");
  const re = { $regex: escapeRegex(v), $options: "i" };

  switch (f.condition.type) {
    case "contains":            return { [key]: re };
    case "notContains":         return { [key]: { $not: re } };
    case "hasOneContaining":    return { [key]: re };
    case "hasOneNotContaining": return { [key]: { $elemMatch: { $not: re } } };
    case "allContain":
      return {
        $and: [
          { [key]: { $exists: true, $not: { $size: 0 } } },
          { [key]: { $not: { $elemMatch: { $not: re } } } },
        ],
      } as Q;
    case "noneContain":         return { [key]: { $not: re } };
  }
}

function numberCondition(f: FilterBuilderValue): Q | undefined {
  const key = f.property;
  const n = Number(f.value[0]?.value ?? f.value[0]?.label);
  if (Number.isNaN(n)) return undefined;

  switch (f.condition.type) {
    case "equals":            return { [key]: n };
    case "greaterThan":       return { [key]: { $gt: n } };
    case "lessThan":          return { [key]: { $lt: n } };
    case "hasOneEqual":       return { [key]: n };
    case "hasOneGreaterThan": return { [key]: { $gt: n } };
    case "hasOneLessThan":    return { [key]: { $lt: n } };
    case "allEqual":          return allMustSatisfy(key, { $ne: n });
    case "allGreaterThan":    return allMustSatisfy(key, { $lte: n });
    case "allLessThan":       return allMustSatisfy(key, { $gte: n });
  }
}

function dateCondition(f: FilterBuilderValue): Q | undefined {
  const key = f.property;
  const raw = f.value[0]?.value ?? f.value[0]?.label;
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) return undefined;

  switch (f.condition.type) {
    case "equals":       return { [key]: d };
    case "before":       return { [key]: { $lt: d } };
    case "after":        return { [key]: { $gt: d } };
    case "hasOneOn":     return { [key]: d };
    case "hasOneBefore": return { [key]: { $lt: d } };
    case "hasOneAfter":  return { [key]: { $gt: d } };
    case "allAreOn":     return allMustSatisfy(key, { $ne: d });
    case "allAreBefore": return allMustSatisfy(key, { $gte: d });
    case "allAreAfter":  return allMustSatisfy(key, { $lte: d });
  }
}

function booleanCondition(f: FilterBuilderValue): Q | undefined {
  const key = f.property;
  const b = Boolean(f.value[0]?.value);

  switch (f.condition.type) {
    case "equals":      return { [key]: b };
    case "hasOneEqual": return { [key]: b };
    case "allEqual":    return allMustSatisfy(key, { $ne: b });
  }
}

function selectCondition(f: FilterBuilderValue): Q | undefined {
  const ids = f.value
    .map((opt) => idOf(opt.value))
    .filter((id): id is string => typeof id === "string");
  if (ids.length === 0) return undefined;

  const isJunction = f.property === "skills";
  const key = isJunction
    ? "skillIds"
    : f.property === "department"
      ? "departmentId"
      : f.property;

  switch (f.condition.type) {
    case "equals":    return { [key]: ids[0] };
    case "notEquals": return { [key]: { $ne: ids[0] } };
    case "anyOf":     return { [key]: { $in: ids } };
    case "noneOf":    return { [key]: { $nin: ids } };
    case "includes":  return { [key]: { $in: ids } };
    case "excludes":  return { [key]: { $nin: ids } };
    case "includesAll": return { [key]: { $all: ids } };
    case "excludesAll": return { [key]: { $nin: ids } };
    case "areAll":      return allMustSatisfy(key, { $ne: ids[0] });
  }
}

function allMustSatisfy(key: string, failingPredicate: object): Q {
  return {
    $and: [
      { [key]: { $exists: true, $not: { $size: 0 } } },
      { [key]: { $not: { $elemMatch: failingPredicate } } },
    ],
  } as Q;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function idOf(maybe: unknown): unknown {
  return maybe && typeof maybe === "object" && "id" in maybe
    ? (maybe as { id: unknown }).id
    : maybe;
}

export { Employee };
