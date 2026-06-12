import * as React from "react";

import {
  FilterBuilder,
  filterConditions,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import type { Employee } from "../../../data/employees.ts";
import type { FilterFieldConfig } from "../../shared.ts";
import { EMPLOYEES_QUERY, toGraphQLWhere } from "../graphql.ts";
import { useFilterParams } from "../url/vanilla.ts";

const GRAPHQL_ENDPOINT = "/graphql";

type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] };

async function fetchEmployees(
  filters: FilterBuilderValue[],
  signal?: AbortSignal,
): Promise<Employee[]> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: EMPLOYEES_QUERY.loc?.source.body,
      variables: { where: toGraphQLWhere(filters) },
    }),
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as GraphQLResponse<{ employees: Employee[] }>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }
  return json.data?.employees ?? [];
}

export function EmployeeTable({
  registry,
}: {
  registry: FilterFieldConfig[];
}): React.ReactNode {
  const [filters, setFilters] = useFilterParams(registry, filterConditions);
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
