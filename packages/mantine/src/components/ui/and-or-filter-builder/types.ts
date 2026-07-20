/* ------------------------------------------------------------------ */
/* Model                                                              */
/* ------------------------------------------------------------------ */

export type Join = "AND" | "OR";

/** Which UI selector + comparison rules a field uses. */
export type FieldType = "text" | "number" | "date" | "boolean" | "select";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  /** key on the row object, e.g. "city" */
  value: string;
  /** label shown in the UI, e.g. "City" */
  label: string;
  /** UI selector + comparison rules for this field (default "text") */
  type?: FieldType;
  /** required when type is "select" — the picklist shown in the value input */
  options?: FieldOption[];
}

/** Naming matches the grouped filter-builder's condition `type` vocabulary (see filter-builder/types.ts). */
export type Operator =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "anyOf"
  | "noneOf"
  | "startsWith"
  | "greaterThan"
  | "lessThan"
  | "before"
  | "after"
  | "empty"
  | "notEmpty";

export interface Condition {
  id: string;
  field: string; // FieldDef.value
  op: Operator;
  /** raw string(s); interpreted per field type at match time. Multiple entries only for "anyOf" / "noneOf". */
  values: string[];
}

export interface FilterGroup {
  id: string;
  /** operator between conditions[i] and conditions[i+1]; length === conditions.length - 1 */
  joins: Join[];
  conditions: Condition[];
}

export interface FilterQuery {
  /** operator between groups[i] and groups[i+1]; length === groups.length - 1 */
  joins: Join[];
  groups: FilterGroup[];
}

export interface OperatorDef {
  value: Operator;
  label: string;
  needsValue: boolean;
  /** value input accepts more than one selection (currently only select fields) */
  multiple?: boolean;
}

/** The condition list — and thus the value widget — depends on the field's type. */
export const OPERATORS_BY_TYPE: Record<FieldType, OperatorDef[]> = {
  text: [
    { value: "contains", label: "contains", needsValue: true },
    { value: "notContains", label: "does not contain", needsValue: true },
    { value: "equals", label: "equals", needsValue: true },
    { value: "startsWith", label: "starts with", needsValue: true },
    { value: "empty", label: "is empty", needsValue: false },
    { value: "notEmpty", label: "is not empty", needsValue: false },
  ],
  number: [
    { value: "equals", label: "equals", needsValue: true },
    { value: "greaterThan", label: "is greater than", needsValue: true },
    { value: "lessThan", label: "is less than", needsValue: true },
    { value: "empty", label: "is empty", needsValue: false },
    { value: "notEmpty", label: "is not empty", needsValue: false },
  ],
  date: [
    { value: "equals", label: "is on", needsValue: true },
    { value: "before", label: "is before", needsValue: true },
    { value: "after", label: "is after", needsValue: true },
    { value: "empty", label: "is empty", needsValue: false },
    { value: "notEmpty", label: "is not empty", needsValue: false },
  ],
  boolean: [{ value: "equals", label: "is", needsValue: true }],
  select: [
    { value: "equals", label: "is", needsValue: true },
    { value: "notEquals", label: "is not", needsValue: true },
    { value: "anyOf", label: "is one of", needsValue: true, multiple: true },
    { value: "noneOf", label: "is none of", needsValue: true, multiple: true },
    { value: "empty", label: "is empty", needsValue: false },
    { value: "notEmpty", label: "is not empty", needsValue: false },
  ],
};

export const fieldType = (f: FieldDef | undefined): FieldType => f?.type ?? "text";

export const operatorsForField = (f: FieldDef | undefined): OperatorDef[] =>
  OPERATORS_BY_TYPE[fieldType(f)];

export const operatorDef = (f: FieldDef | undefined, op: Operator): OperatorDef => {
  const list = operatorsForField(f);
  return list.find((o) => o.value === op) ?? list[0];
};

export const operatorLabel = (f: FieldDef | undefined, op: Operator) => operatorDef(f, op).label;
export const operatorNeedsValue = (f: FieldDef | undefined, op: Operator) =>
  operatorDef(f, op).needsValue;
export const operatorIsMultiple = (f: FieldDef | undefined, op: Operator) =>
  Boolean(operatorDef(f, op).multiple);

export const defaultOperatorFor = (f: FieldDef | undefined): Operator =>
  operatorsForField(f)[0].value;

export const fieldByName = (fields: FieldDef[], name: string): FieldDef | undefined =>
  fields.find((f) => f.value === name);

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const emptyQuery = (): FilterQuery => ({ joins: [], groups: [] });
