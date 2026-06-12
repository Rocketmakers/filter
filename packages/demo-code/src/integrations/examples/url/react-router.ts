import * as React from "react";
import { useSearchParams } from "react-router";

import {
  filterConditions,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import {
  FILTER_PARAM,
  parseFilters,
  writeFilterParams,
} from "./shared.ts";
import type { FilterCondition, FilterFieldConfig } from "../../shared.ts";

export function useFilterParams(
  registry: FilterFieldConfig[],
  conditions: FilterCondition[] = filterConditions,
): readonly [FilterBuilderValue[], (next: FilterBuilderValue[]) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawFilters = React.useMemo(
    () => searchParams.getAll(FILTER_PARAM),
    [searchParams],
  );

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
      setSearchParams(
        (prev) => {
          const updated = writeFilterParams(prev, next);
          // Pre-record what we're about to write so the rehydrate effect
          // skips re-parsing (which would mint new uuids for every row).
          lastRawRef.current = updated.getAll(FILTER_PARAM).join("|");
          return updated;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  return [filters, setFilters] as const;
}
