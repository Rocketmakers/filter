import axios from "axios";
import * as React from "react";

import {
  FilterBuilder,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import type { Employee } from "../../../data/employees.ts";
import type { FilterFieldConfig } from "../../shared.ts";
import { EMPLOYEES_QUERY, toGraphQLWhere } from "../graphql.ts";

const client = axios.create({ baseURL: "/" });

type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] };

async function fetchEmployees(
  filters: FilterBuilderValue[],
  signal?: AbortSignal,
): Promise<Employee[]> {
  const { data } = await client.post<
    GraphQLResponse<{ employees: Employee[] }>
  >(
    "/graphql",
    {
      query: EMPLOYEES_QUERY.loc?.source.body,
      variables: { where: toGraphQLWhere(filters) },
    },
    { signal },
  );
  if (data.errors?.length) {
    throw new Error(data.errors.map((e) => e.message).join(", "));
  }
  return data.data?.employees ?? [];
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
        if (!axios.isCancel(err)) console.error(err);
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
