import * as React from "react";

import {
  FilterBuilder,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import type { FilterFieldConfig } from "../../shared.ts";

type FilterContextValue = {
  filters: FilterBuilderValue[];
  setFilters: (next: FilterBuilderValue[]) => void;
};

const FilterContext = React.createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = React.useState<FilterBuilderValue[]>([]);
  const value = React.useMemo(() => ({ filters, setFilters }), [filters]);
  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = React.useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilters must be used within <FilterProvider>");
  }
  return ctx;
}

export function EmployeeTable({
  registry,
}: {
  registry: FilterFieldConfig[];
}): React.ReactNode {
  const { filters, setFilters } = useFilters();
  return (
    <FilterBuilder filters={registry} value={filters} onChange={setFilters} />
  );
}
