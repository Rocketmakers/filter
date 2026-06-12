"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      const params = writeFilterParams(
        new URLSearchParams(searchParams.toString()),
        next,
      );
      // Pre-record what we're about to write so the rehydrate effect
      // skips re-parsing (which would mint new uuids for every row).
      lastRawRef.current = params.getAll(FILTER_PARAM).join("|");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return [filters, setFilters] as const;
}
