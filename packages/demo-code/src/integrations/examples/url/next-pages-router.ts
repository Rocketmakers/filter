import { useRouter } from "next/router";
import * as React from "react";

import {
  filterConditions,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import {
  FILTER_PARAM,
  parseFilters,
  serializeFilters,
} from "./shared.ts";
import type { FilterCondition, FilterFieldConfig } from "../../shared.ts";

function readParam(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
}

export function useFilterParams(
  registry: FilterFieldConfig[],
  conditions: FilterCondition[] = filterConditions,
): readonly [FilterBuilderValue[], (next: FilterBuilderValue[]) => void] {
  const router = useRouter();
  const rawFilters = React.useMemo(
    () => readParam(router.query[FILTER_PARAM]),
    [router.query],
  );

  const [filters, setFiltersState] = React.useState<FilterBuilderValue[]>(
    () => parseFilters(rawFilters, registry, conditions),
  );

  const lastRawRef = React.useRef(rawFilters.join("|"));
  React.useEffect(() => {
    if (!router.isReady) return;
    const joined = rawFilters.join("|");
    if (joined === lastRawRef.current) return;
    lastRawRef.current = joined;
    setFiltersState(parseFilters(rawFilters, registry, conditions));
  }, [router.isReady, rawFilters, registry, conditions]);

  const setFilters = React.useCallback(
    (next: FilterBuilderValue[]) => {
      setFiltersState(next);
      const { [FILTER_PARAM]: _drop, ...rest } = router.query;
      const serialized = serializeFilters(next);
      lastRawRef.current = serialized.join("|");
      const query =
        serialized.length > 0 ? { ...rest, [FILTER_PARAM]: serialized } : rest;
      router.replace(
        { pathname: router.pathname, query },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );

  return [filters, setFilters] as const;
}
