import {
  createRootRoute,
  createRoute,
  useNavigate,
} from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";

import {
  filterConditions,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import {
  parseFilters,
  serializeFilters,
} from "./shared.ts";
import type { FilterCondition, FilterFieldConfig } from "../../shared.ts";

const rootRoute = createRootRoute();

const searchSchema = z.object({
  filter: z.array(z.string()).catch([]),
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/employees",
  validateSearch: searchSchema,
  component: EmployeesPage,
});

export function useFilterParams(
  registry: FilterFieldConfig[],
  conditions: FilterCondition[] = filterConditions,
): readonly [FilterBuilderValue[], (next: FilterBuilderValue[]) => void] {
  const { filter: rawFilters } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [filters, setFiltersState] = React.useState<FilterBuilderValue[]>(
    () => parseFilters(rawFilters, registry, conditions),
  );

  const lastRawRef = React.useRef(rawFilters.join("|"));
  React.useEffect(() => {
    const joined = rawFilters.join("|");
    if (joined === lastRawRef.current) return;
    lastRawRef.current = joined;
    setFiltersState(parseFilters(rawFilters, registry, conditions));
  }, [rawFilters, registry, conditions]);

  const setFilters = React.useCallback(
    (next: FilterBuilderValue[]) => {
      setFiltersState(next);
      const serialized = serializeFilters(next);
      // Pre-record what we're about to write so the rehydrate effect
      // skips re-parsing (which would mint new uuids for every row).
      lastRawRef.current = serialized.join("|");
      navigate({
        search: (prev: z.infer<typeof searchSchema>) => ({
          ...prev,
          filter: serialized,
        }),
        replace: true,
      });
    },
    [navigate],
  );

  return [filters, setFilters] as const;
}

function EmployeesPage(): React.ReactNode {
  return null;
}
