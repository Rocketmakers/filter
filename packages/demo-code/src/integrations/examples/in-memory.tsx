import * as React from "react";

import {
  FilterBuilder,
  useFilteredRows,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import type { Employee } from "../../data/employees.ts";

export function EmployeeTable({
  rows,
  registry,
}: {
  rows: Employee[];
  registry: Parameters<typeof FilterBuilder>[0]["filters"];
}): React.ReactNode {
  const [filters, setFilters] = React.useState<FilterBuilderValue[]>([]);
  const visible = useFilteredRows(rows, filters);

  return (
    <>
      <FilterBuilder
        filters={registry}
        value={filters}
        onChange={setFilters}
      />
      <ul>
        {visible.map((emp) => (
          <li key={emp.id}>{emp.name}</li>
        ))}
      </ul>
    </>
  );
}
