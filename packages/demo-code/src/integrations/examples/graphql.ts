import gql from "graphql-tag";
import type { DocumentNode } from "graphql";

import type { FilterBuilderValue, FilterDataType } from "../shared.ts";

export const EMPLOYEES_QUERY: DocumentNode = gql`
  query Employees($where: employees_bool_exp!) {
    employees(where: $where) {
      id
      name
      email
      role
      salary
      isActive
      department {
        id
        name
      }
      skills {
        id
        name
      }
    }
  }
`;

type Expr = Record<string, unknown>;

export function toGraphQLWhere(filters: FilterBuilderValue[]): {
  _and: Expr[];
} {
  const _and = filters
    .map(toExpression)
    .filter((e): e is Expr => e !== undefined);
  return { _and };
}

function toExpression(f: FilterBuilderValue): Expr | undefined {
  switch (f.condition.dataType) {
    case "text":     return textExpression(f);
    case "number":   return numberExpression(f);
    case "date":
    case "dateTime": return dateExpression(f);
    case "boolean":  return booleanExpression(f);
    case "select":   return selectExpression(f);
  }
}

function textExpression(f: FilterBuilderValue): Expr | undefined {
  const key = f.property;
  const v = String(f.value[0]?.value ?? f.value[0]?.label ?? "");
  const pattern = `%${v}%`;

  switch (f.condition.type) {
    case "contains":            return { [key]: { _ilike: pattern } };
    case "notContains":         return { _not: { [key]: { _ilike: pattern } } };
    case "hasOneContaining":    return { [key]: { _ilike: pattern } };
    case "hasOneNotContaining": return { _not: { [key]: { _ilike: pattern } } };
    case "allContain":          return { [key]: { _contains: [v] } };
    case "noneContain":         return { _not: { [key]: { _ilike: pattern } } };
  }
}

function numberExpression(f: FilterBuilderValue): Expr | undefined {
  const key = f.property;
  const n = Number(f.value[0]?.value ?? f.value[0]?.label);
  if (Number.isNaN(n)) return undefined;

  switch (f.condition.type) {
    case "equals":            return { [key]: { _eq: n } };
    case "greaterThan":       return { [key]: { _gt: n } };
    case "lessThan":          return { [key]: { _lt: n } };
    case "hasOneEqual":       return { [key]: { _eq: n } };
    case "hasOneGreaterThan": return { [key]: { _gt: n } };
    case "hasOneLessThan":    return { [key]: { _lt: n } };
    case "allEqual":          return { [key]: { _contains: [n] } };
    case "allGreaterThan":    return { [key]: { _contains: [n] } };
    case "allLessThan":       return { [key]: { _contains: [n] } };
  }
}

function dateExpression(f: FilterBuilderValue): Expr | undefined {
  const key = f.property;
  const raw = f.value[0]?.value ?? f.value[0]?.label;
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) return undefined;
  const iso = d.toISOString();

  switch (f.condition.type) {
    case "equals":       return { [key]: { _eq: iso } };
    case "before":       return { [key]: { _lt: iso } };
    case "after":        return { [key]: { _gt: iso } };
    case "hasOneOn":     return { [key]: { _eq: iso } };
    case "hasOneBefore": return { [key]: { _lt: iso } };
    case "hasOneAfter":  return { [key]: { _gt: iso } };
    case "allAreOn":     return { [key]: { _contains: [iso] } };
    case "allAreBefore": return { [key]: { _contains: [iso] } };
    case "allAreAfter":  return { [key]: { _contains: [iso] } };
  }
}

function booleanExpression(f: FilterBuilderValue): Expr | undefined {
  const key = f.property;
  const b = Boolean(f.value[0]?.value);

  switch (f.condition.type) {
    case "equals":      return { [key]: { _eq: b } };
    case "hasOneEqual": return { [key]: { _eq: b } };
    case "allEqual":    return { [key]: { _contains: [b] } };
  }
}

function selectExpression(f: FilterBuilderValue): Expr | undefined {
  const ids = f.value
    .map((opt) => idOf(opt.value))
    .filter((id): id is string => typeof id === "string");
  if (ids.length === 0) return undefined;

  if (f.property === "department") {
    switch (f.condition.type) {
      case "equals":    return { department_id: { _eq: ids[0] } };
      case "notEquals": return { department_id: { _neq: ids[0] } };
      case "anyOf":     return { department_id: { _in: ids } };
      case "noneOf":    return { department_id: { _nin: ids } };
    }
    return undefined;
  }

  if (f.property === "skills") {
    switch (f.condition.type) {
      case "includes":
        return { skills: { id: { _in: ids } } };
      case "excludes":
      case "excludesAll":
        return { _not: { skills: { id: { _in: ids } } } };
      case "includesAll":
        return { _and: ids.map((id) => ({ skills: { id: { _eq: id } } })) };
      case "areAll":
        return {
          _not: { skills: { id: { _neq: ids[0] } } },
        };
    }
    return undefined;
  }
}

function idOf(maybe: unknown): unknown {
  return maybe && typeof maybe === "object" && "id" in maybe
    ? (maybe as { id: unknown }).id
    : maybe;
}

export type { FilterDataType };
