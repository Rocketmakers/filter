import { useCallback, useEffect, useState } from "react";

import { emptyQuery, type FieldDef, type FilterQuery } from "./types";
import { FILTER_PARAM, JOINS_PARAM, parseFilterQuery, writeFilterParams } from "./url";

function readFromLocation(fields: FieldDef[]): FilterQuery {
  if (typeof window === "undefined") return emptyQuery();
  const params = new URLSearchParams(window.location.search);
  return parseFilterQuery(params.getAll(FILTER_PARAM), params.get(JOINS_PARAM), fields);
}

/**
 * Keeps a FilterQuery in sync with the URL search params, so the current
 * filter state is shareable and survives back/forward navigation.
 */
export function useUrlFilterQuery(
  fields: FieldDef[],
): readonly [FilterQuery, (next: FilterQuery) => void] {
  const [query, setQueryState] = useState<FilterQuery>(() => readFromLocation(fields));

  useEffect(() => {
    const onPopState = () => setQueryState(readFromLocation(fields));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [fields]);

  const setQuery = useCallback((next: FilterQuery) => {
    setQueryState(next);
    const current = new URLSearchParams(window.location.search);
    const updated = writeFilterParams(current, next);
    const qs = updated.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(window.history.state, "", url);
  }, []);

  return [query, setQuery] as const;
}
