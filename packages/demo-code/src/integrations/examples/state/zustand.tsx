import * as React from "react";
import { create } from "zustand";

import {
  FilterBuilder,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import type { FilterFieldConfig } from "../../shared.ts";

type FilterStore = {
  filters: FilterBuilderValue[];
  setFilters: (next: FilterBuilderValue[]) => void;
  clear: () => void;
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: [],
  setFilters: (next) => set({ filters: next }),
  clear: () => set({ filters: [] }),
}));

export function EmployeeTable({
  registry,
}: {
  registry: FilterFieldConfig[];
}): React.ReactNode {
  const filters = useFilterStore((s) => s.filters);
  const setFilters = useFilterStore((s) => s.setFilters);
  return (
    <FilterBuilder filters={registry} value={filters} onChange={setFilters} />
  );
}
