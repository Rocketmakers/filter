import * as React from "react";

import type {
  FilterBuilderValue,
  FilterCondition,
  FilterFieldConfig,
} from "../../shared.ts";

import {
  FILTER_PARAM,
  parseFilters,
  writeFilterParams,
} from "./shared.ts";

export function useFilterParams(
  registry: FilterFieldConfig[],
  conditions: FilterCondition[],
): readonly [FilterBuilderValue[], (next: FilterBuilderValue[]) => void] {
  const [filters, setFiltersState] = React.useState<FilterBuilderValue[]>(
    () => {
      if (typeof window === "undefined") return [];
      const params = new URLSearchParams(window.location.search);
      return parseFilters(params.getAll(FILTER_PARAM), registry, conditions);
    },
  );

  React.useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      setFiltersState(
        parseFilters(params.getAll(FILTER_PARAM), registry, conditions),
      );
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [registry, conditions]);

  const setFilters = React.useCallback(
    (next: FilterBuilderValue[]) => {
      setFiltersState(next);
      const current = new URLSearchParams(window.location.search);
      const updated = writeFilterParams(current, next);
      const qs = updated.toString();
      const url = qs
        ? `${window.location.pathname}?${qs}`
        : window.location.pathname;
      window.history.replaceState(window.history.state, "", url);
    },
    [],
  );

  return [filters, setFilters] as const;
}
