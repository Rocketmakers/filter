export type FilterDataType =
  | "text"
  | "select"
  | "date"
  | "dateTime"
  | "number"
  | "boolean";

export type FilterCondition = {
  type: string;
  label: string;
  dataType: FilterDataType;
  positive?: boolean;
  multiple?: boolean | "bothMultipleAndSingle";
  multipleValues?: boolean;
};

export type FilterBuilderValue = {
  id: string;
  property: string;
  condition: FilterCondition;
  value: { id: string; label: string; value: unknown }[];
  locked?: boolean;
  lockedCondition?: boolean;
};

export type FilterFieldConfig = {
  name: string;
  type: FilterDataType;
};

export const filterConditions: FilterCondition[] = [];

export declare function useFilteredRows<T>(
  rows: T[],
  filters: FilterBuilderValue[],
): T[];

export declare function FilterBuilder(props: {
  id?: string;
  filters: ReadonlyArray<{ name: string; type: FilterDataType }>;
  value: FilterBuilderValue[];
  onChange: (next: FilterBuilderValue[]) => void;
}): import("react").ReactNode;
