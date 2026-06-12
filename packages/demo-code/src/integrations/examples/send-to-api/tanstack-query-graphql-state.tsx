import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import {
  FilterBuilder,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import type { Employee } from "../../../data/employees.ts";
import type { FilterFieldConfig } from "../../shared.ts";
import { EMPLOYEES_QUERY, toGraphQLWhere } from "../graphql.ts";

const GRAPHQL_ENDPOINT = "/graphql";

type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] };

async function fetchEmployees(
  where: ReturnType<typeof toGraphQLWhere>,
  signal?: AbortSignal,
): Promise<Employee[]> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: EMPLOYEES_QUERY.loc?.source.body,
      variables: { where },
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

function useEmployees(filters: FilterBuilderValue[]) {
  const where = toGraphQLWhere(filters);
  return useQuery({
    queryKey: ["employees-gql", where] as const,
    queryFn: ({ signal }) => fetchEmployees(where, signal),
    placeholderData: (prev) => prev,
  });
}

export function EmployeeTable({
  registry,
}: {
  registry: FilterFieldConfig[];
}): React.ReactNode {
  const [filters, setFilters] = React.useState<FilterBuilderValue[]>([]);
  const { data: rows = [], isLoading, error } = useEmployees(filters);

  return (
    <>
      <FilterBuilder filters={registry} value={filters} onChange={setFilters} />
      {error ? <p>Error: {(error as Error).message}</p> : null}
      <ul style={{ opacity: isLoading ? 0.5 : 1 }}>
        {rows.map((r) => (
          <li key={r.id}>{r.name}</li>
        ))}
      </ul>
    </>
  );
}
