import { useCallback, useMemo } from "react";

import { Filter } from "@/components/ui/filter";

import { FilterBuilderAdd } from "./add-button";
import { FilterBuilderBox } from "./box";
import {
  FilterBuilderContextProvider,
  type FilterBuilderContextValue,
} from "./context";
import type {
  FilterBaseOption,
  FilterBuilderValue,
  FilterCondition,
  FilterConfig,
  FilterOptionRegistry,
} from "./types";
import {
  getValidConditions,
  updateFilterCondition,
  updateFilterValue,
} from "./utils";

export type FilterBuilderProps = {
  id?: string;
  filters: FilterOptionRegistry;
  value: FilterBuilderValue[];
  onChange: (value: FilterBuilderValue[]) => void;
  allowDuplicateFilters?: boolean;
};

export function FilterBuilder({
  id,
  filters,
  value,
  onChange,
  allowDuplicateFilters = true,
}: FilterBuilderProps) {
  const addFilter = useCallback(
    (
      newId: string,
      filter: FilterConfig,
      newValue: FilterBaseOption[],
    ) => {
      // Every filter type carries an optional `multipleValues` flag now, so
      // any field shape (text[], number[], boolean[], date[], etc.) can opt
      // into plural-aware operators. Boolean is the only type where the
      // property doesn't live on the config interface itself — it's read
      // off the union via duck-type.
      const multipleValues =
        "multipleValues" in filter ? filter.multipleValues : undefined;
      const hasMultipleValues = newValue.length > 1;

      const validConditions = getValidConditions(
        filter.type,
        hasMultipleValues,
        multipleValues,
        true,
      );
      if (validConditions.length === 0) return;

      onChange([
        ...value,
        {
          id: newId,
          property: filter.name,
          condition: validConditions[0],
          value: newValue,
        },
      ]);
    },
    [onChange, value],
  );

  const updateFilter = useCallback(
    (filterId: string, newValue: FilterBaseOption[]) => {
      onChange(updateFilterValue(value, filterId, newValue));
    },
    [onChange, value],
  );

  const updateFilterValueCondition = useCallback(
    (filterId: string, condition: FilterCondition) => {
      onChange(updateFilterCondition(value, filterId, condition));
    },
    [onChange, value],
  );

  const doesFilterExist = useCallback(
    (filterId: string) => value.some((filter) => filter.id === filterId),
    [value],
  );

  const removeFilter = useCallback(
    (filterId: string) => {
      onChange(value.filter((filter) => filter.id !== filterId));
    },
    [onChange, value],
  );

  const selectableFilters = useMemo(
    () =>
      allowDuplicateFilters
        ? filters
        : filters.map((f) => ({
            ...f,
            hidden:
              value.some((v) => v.property === f.name) &&
              f.type !== "dateTime" &&
              f.type !== "date",
          })),
    [allowDuplicateFilters, filters, value],
  );

  const canAddFilter = useMemo(
    () => selectableFilters.some((f) => f.hidden !== true),
    [selectableFilters],
  );

  const contextValue = useMemo<FilterBuilderContextValue>(
    () => ({
      value,
      filters: selectableFilters,
      addFilter,
      removeFilter,
      updateFilter,
      doesFilterExist,
      updateFilterValueCondition,
    }),
    [
      value,
      selectableFilters,
      addFilter,
      removeFilter,
      updateFilter,
      doesFilterExist,
      updateFilterValueCondition,
    ],
  );

  return (
    <FilterBuilderContextProvider {...contextValue}>
      <Filter id={id}>
        {value.map((filter) => (
          <FilterBuilderBox key={filter.id} value={filter} />
        ))}
        <FilterBuilderAdd
          disabled={!canAddFilter}
          hasFilters={value.length > 0}
        />
      </Filter>
    </FilterBuilderContextProvider>
  );
}
