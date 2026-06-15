import type {
  FilterBuilderValue,
  FilterCondition,
  FilterDataType,
  FilterFieldConfig,
} from "../../shared.ts";

export const FILTER_PARAM = "filter";
const SEP = ".";

const encodeSegment = (s: string): string =>
  encodeURIComponent(s).replace(/\./g, "%2E");

const hasId = (v: unknown): v is { id: unknown } =>
  typeof v === "object" && v !== null && "id" in v;

function serializeValue(
  raw: unknown,
  fallbackLabel: string,
  dataType: FilterDataType,
): string {
  if ((dataType === "date" || dataType === "dateTime") && raw instanceof Date) {
    return raw.toISOString();
  }
  if (dataType === "boolean") return raw ? "true" : "false";
  if (hasId(raw)) return String(raw.id);
  return String(raw ?? fallbackLabel ?? "");
}

function hydrateValue(raw: string, dataType: FilterDataType) {
  if (dataType === "date" || dataType === "dateTime") {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return { id: raw, label: d.toLocaleString(), value: d };
    }
  }
  if (dataType === "boolean") {
    const truthy = raw === "true" || raw === "1";
    return { id: raw, label: truthy ? "True" : "False", value: truthy };
  }
  if (dataType === "number") {
    const n = Number(raw);
    if (!Number.isNaN(n)) return { id: raw, label: raw, value: n };
  }
  return { id: raw, label: raw, value: raw };
}

export function serializeFilters(filters: FilterBuilderValue[]): string[] {
  return filters
    .filter((f) => f.value.length > 0)
    .map((f) =>
      [
        encodeSegment(f.property),
        encodeSegment(f.condition.type),
        ...f.value.map((opt) =>
          encodeSegment(
            serializeValue(opt.value, opt.label, f.condition.dataType),
          ),
        ),
      ].join(SEP),
    );
}

export function parseFilters(
  rawValues: string[],
  registry: FilterFieldConfig[],
  conditions: FilterCondition[],
): FilterBuilderValue[] {
  const byDataType = groupConditions(conditions);

  return rawValues.flatMap((raw): FilterBuilderValue[] => {
    const parts = raw.split(SEP).map(decodeURIComponent);
    if (parts.length < 3) return [];
    const [property, conditionType, ...values] = parts;

    const field = registry.find((c) => c.name === property);
    if (!field) return [];

    const condition = byDataType
      .get(field.type)
      ?.find((c) => c.type === conditionType);
    if (!condition) return [];

    return [
      {
        id: `lf-${crypto.randomUUID()}`,
        property,
        condition,
        value: values.map((v) => hydrateValue(v, field.type)),
      },
    ];
  });
}

function groupConditions(
  conditions: FilterCondition[],
): Map<FilterDataType, FilterCondition[]> {
  const map = new Map<FilterDataType, FilterCondition[]>();
  for (const c of conditions) {
    const bucket = map.get(c.dataType) ?? [];
    bucket.push(c);
    map.set(c.dataType, bucket);
  }
  return map;
}

export function writeFilterParams(
  prev: URLSearchParams,
  filters: FilterBuilderValue[],
): URLSearchParams {
  const next = new URLSearchParams(prev);
  next.delete(FILTER_PARAM);
  for (const v of serializeFilters(filters)) next.append(FILTER_PARAM, v);
  return next;
}
