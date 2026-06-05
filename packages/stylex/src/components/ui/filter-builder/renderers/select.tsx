import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

import { useFilterBuilder } from "../context";
import type {
  FilterBaseOption,
  FilterConfig,
  FilterConfigItemsRenderProps,
  FilterObjectConfig,
} from "../types";

export const FilterSelectRenderer = ({
  filter,
  inputValue,
  currentID,
}: FilterConfigItemsRenderProps<FilterObjectConfig<unknown>>) => {
  const supportMultiple = !!filter.multiple;

  const { addFilter, removeFilter, updateFilter, value, doesFilterExist } =
    useFilterBuilder("FilterSelectRenderer");

  const [options, setOptions] = useState<FilterBaseOption<unknown>[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const fetchOptions = useMemo(
    () =>
      debounce(async (searchTerm: string) => {
        const results = await filter.filterSearch(searchTerm);
        setOptions(results.map((result) => filter.mapToFilterOption(result)));
        setLoadingOptions(false);
      }, 400),
    [filter],
  );

  const currentFilter = useMemo(
    () => value.find((f) => f.id === currentID),
    [value, currentID],
  );

  const addOrUpdateFilter = useCallback(
    (config: FilterConfig, option: FilterBaseOption) => {
      if (!doesFilterExist(currentID)) {
        addFilter(currentID, config, [option]);
        return;
      }
      if (!currentFilter) return;

      const isAlreadySelected = currentFilter.value.some(
        (v) => v.id === option.id,
      );

      if (isAlreadySelected) {
        if (currentFilter.value.length === 1) {
          if (!currentFilter.locked) removeFilter(currentID);
          return;
        }
        updateFilter(
          currentID,
          currentFilter.value.filter((v) => v.id !== option.id),
        );
        return;
      }

      if (supportMultiple) {
        updateFilter(currentID, [...currentFilter.value, option]);
        return;
      }
      updateFilter(currentID, [option]);
    },
    [
      addFilter,
      currentFilter,
      currentID,
      doesFilterExist,
      removeFilter,
      supportMultiple,
      updateFilter,
    ],
  );

  const initialSelectedOptions = useMemo(
    () => currentFilter?.value ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const unselectedOptions = useMemo(
    () =>
      options.filter(
        (option) => !initialSelectedOptions.some((sel) => sel.id === option.id),
      ),
    [options, initialSelectedOptions],
  );

  useEffect(() => {
    setLoadingOptions(true);
    fetchOptions(inputValue);
  }, [inputValue, fetchOptions]);

  const isChecked = (option: FilterBaseOption) =>
    !!currentFilter?.value.some((v) => v.id === option.id);

  const renderOption = (option: FilterBaseOption<unknown>) => (
    <CommandItem
      key={option.id}
      value={option.label}
      onSelect={() => addOrUpdateFilter(filter, option)}
    >
      {supportMultiple && (
        <Checkbox
          checked={isChecked(option)}
          onCheckedChange={() => addOrUpdateFilter(filter, option)}
        />
      )}
      {filter.filterOptionRenderer(option)}
    </CommandItem>
  );

  if (loadingOptions) {
    return <CommandEmpty>Loading…</CommandEmpty>;
  }
  if (options.length === 0 && initialSelectedOptions.length === 0) {
    return <CommandEmpty>No options found</CommandEmpty>;
  }

  return (
    <>
      {initialSelectedOptions.length > 0 && (
        <>
          <CommandGroup heading="Selected">
            {initialSelectedOptions.map(renderOption)}
          </CommandGroup>
          <CommandSeparator />
        </>
      )}
      <CommandGroup>{unselectedOptions.map(renderOption)}</CommandGroup>
      {filter.customOptions && filter.customOptions.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading="Suggestions">
            {filter.customOptions.map((option) => (
              <CommandItem
                key={option.id}
                value={option.label}
                onSelect={() => addOrUpdateFilter(filter, option)}
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}
    </>
  );
};
