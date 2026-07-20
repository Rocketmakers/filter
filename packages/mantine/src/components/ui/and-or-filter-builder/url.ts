/**
 * URL (de)serialization for FilterQuery — mirrors the grouped filter-builder's
 * URL integration (see demo-code/integrations/examples/url/shared.ts): a
 * repeated, dot-delimited `property.conditionType.value1.value2…` param per
 * condition, with literal dots in a value escaped so SEP-splitting stays safe.
 *
 * Groups/joins are new concepts the grouped builder doesn't have, so each
 * condition is prefixed with its group index, and a small companion param
 * carries the AND/OR operators (root + per-group) as comma-separated lists.
 */

import { emptyQuery, uid, type Condition, type FieldDef, type FilterGroup, type FilterQuery, type Join } from "./types";

export const FILTER_PARAM = "andorFilter";
export const JOINS_PARAM = "andorJoins";
const SEP = ".";

const encodeSegment = (s: string): string => encodeURIComponent(s).replace(/\./g, "%2E");

function serializeCondition(groupIndex: number, c: Condition): string {
  return [String(groupIndex), encodeSegment(c.field), encodeSegment(c.op), ...c.values.map(encodeSegment)].join(
    SEP,
  );
}

function parseCondition(
  raw: string,
  fields: FieldDef[],
): { groupIndex: number; condition: Condition } | null {
  const parts = raw.split(SEP).map(decodeURIComponent);
  if (parts.length < 3) return null;
  const [groupIndexRaw, field, op, ...values] = parts;
  const groupIndex = Number(groupIndexRaw);
  if (!Number.isInteger(groupIndex) || groupIndex < 0) return null;
  if (!fields.some((f) => f.value === field)) return null; // unknown field — drop rather than crash
  return { groupIndex, condition: { id: uid(), field, op: op as Condition["op"], values } };
}

function parseJoinList(raw: string): Join[] {
  if (!raw) return [];
  return raw.split(",").filter((x): x is Join => x === "AND" || x === "OR");
}

/** keeps a joins array's length in sync with its item count, regardless of URL tampering */
function normalizeJoins(joins: Join[], itemCount: number): Join[] {
  const needed = Math.max(0, itemCount - 1);
  if (joins.length === needed) return joins;
  const next = joins.slice(0, needed);
  while (next.length < needed) next.push("AND");
  return next;
}

export function serializeFilterQuery(query: FilterQuery): { filters: string[]; joins: string } {
  const filters: string[] = [];
  query.groups.forEach((g, gi) => {
    g.conditions.forEach((c) => filters.push(serializeCondition(gi, c)));
  });
  const joins = [query.joins.join(","), ...query.groups.map((g) => g.joins.join(","))].join("~");
  return { filters, joins };
}

export function parseFilterQuery(rawFilters: string[], rawJoins: string | null, fields: FieldDef[]): FilterQuery {
  const groupOrder: number[] = [];
  const byGroup = new Map<number, Condition[]>();
  for (const raw of rawFilters) {
    const parsed = parseCondition(raw, fields);
    if (!parsed) continue;
    if (!byGroup.has(parsed.groupIndex)) {
      byGroup.set(parsed.groupIndex, []);
      groupOrder.push(parsed.groupIndex);
    }
    byGroup.get(parsed.groupIndex)?.push(parsed.condition);
  }
  if (groupOrder.length === 0) return emptyQuery();
  groupOrder.sort((a, b) => a - b);

  const joinSegments = (rawJoins ?? "").split("~");

  const groups: FilterGroup[] = groupOrder.map((gi, idx) => {
    const conditions = byGroup.get(gi) ?? [];
    const groupJoins = normalizeJoins(parseJoinList(joinSegments[idx + 1] ?? ""), conditions.length);
    return { id: uid(), conditions, joins: groupJoins };
  });

  const rootJoins = normalizeJoins(parseJoinList(joinSegments[0] ?? ""), groups.length);
  return { groups, joins: rootJoins };
}

export function writeFilterParams(prev: URLSearchParams, query: FilterQuery): URLSearchParams {
  const next = new URLSearchParams(prev);
  next.delete(FILTER_PARAM);
  next.delete(JOINS_PARAM);
  const { filters, joins } = serializeFilterQuery(query);
  for (const f of filters) next.append(FILTER_PARAM, f);
  if (filters.length > 0) next.set(JOINS_PARAM, joins);
  return next;
}
