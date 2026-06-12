import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import * as React from "react";

import {
  FilterBuilder,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import type { FilterFieldConfig } from "../../shared.ts";

class FilterStore {
  filters: FilterBuilderValue[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  setFilters(next: FilterBuilderValue[]) {
    this.filters = next;
  }

  clear() {
    this.filters = [];
  }
}

export const filterStore = new FilterStore();

export const EmployeeTable = observer(function EmployeeTable({
  registry,
}: {
  registry: FilterFieldConfig[];
}): React.ReactNode {
  return (
    <FilterBuilder
      filters={registry}
      value={filterStore.filters}
      onChange={(next) => filterStore.setFilters(next)}
    />
  );
});
