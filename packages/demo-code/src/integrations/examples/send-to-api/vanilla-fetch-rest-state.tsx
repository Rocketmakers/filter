import * as React from "react";

import {
  FilterBuilder,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import type { Employee } from "../../../data/employees.ts";
import type { FilterFieldConfig } from "../../shared.ts";
import { serializeFilters } from "../url/shared.ts";

const API_BASE = "/api/employees";

async function fetchEmployees(
  filters: FilterBuilderValue[],
  signal?: AbortSignal,
): Promise<Employee[]> {
  const params = new URLSearchParams();
  for (const f of serializeFilters(filters)) params.append("filter", f);
  const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Employee[];
}

export function EmployeeTable({
  registry,
}: {
  registry: FilterFieldConfig[];
}): React.ReactNode {
  const [filters, setFilters] = React.useState<FilterBuilderValue[]>([]);
  const [rows, setRows] = React.useState<Employee[]>([]);

  React.useEffect(() => {
    const controller = new AbortController();
    fetchEmployees(filters, controller.signal)
      .then(setRows)
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });
    return () => controller.abort();
  }, [filters]);

  return (
    <>
      <FilterBuilder filters={registry} value={filters} onChange={setFilters} />
      <ul>
        {rows.map((r) => (
          <li key={r.id}>{r.name}</li>
        ))}
      </ul>
    </>
  );
}
