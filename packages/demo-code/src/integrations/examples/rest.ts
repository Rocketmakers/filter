import type { FilterBuilderValue, FilterDataType } from "../shared.ts";

export function toRestQueryString(filters: FilterBuilderValue[]): string {
  const params = new URLSearchParams();

  for (const f of filters) {
    if (f.value.length === 0) continue;
    const op = f.condition.type;
    const dt = f.condition.dataType;

    for (const opt of f.value) {
      params.append(
        `filter[${f.property}][${op}]`,
        serializeValue(opt.value, opt.label, dt),
      );
    }
  }

  return params.toString();
}

function serializeValue(
  raw: unknown,
  fallbackLabel: string,
  dataType: FilterDataType,
): string {
  if (dataType === "date" || dataType === "dateTime") {
    if (raw instanceof Date) return raw.toISOString();
    return new Date(String(raw)).toISOString();
  }
  if (dataType === "boolean") return raw ? "true" : "false";
  if (raw && typeof raw === "object" && "id" in raw) {
    return String((raw as { id: unknown }).id);
  }
  return String(raw ?? fallbackLabel ?? "");
}

export function parseRestQueryString(
  qs: string,
  registry: { name: string; type: FilterDataType }[],
): Array<{
  property: string;
  conditionType: string;
  dataType: FilterDataType;
  values: string[];
}> {
  const out: Map<
    string,
    {
      property: string;
      conditionType: string;
      dataType: FilterDataType;
      values: string[];
    }
  > = new Map();
  const params = new URLSearchParams(qs);

  for (const [rawKey, value] of params) {
    const m = rawKey.match(/^filter\[(?<prop>[^\]]+)\]\[(?<op>[^\]]+)\]$/);
    if (!m?.groups) continue;
    const { prop, op } = m.groups;
    const field = registry.find((c) => c.name === prop);
    if (!field) continue;
    const groupKey = `${prop}|${op}`;
    const entry = out.get(groupKey) ?? {
      property: prop,
      conditionType: op,
      dataType: field.type,
      values: [],
    };
    entry.values.push(value);
    out.set(groupKey, entry);
  }

  return [...out.values()];
}
