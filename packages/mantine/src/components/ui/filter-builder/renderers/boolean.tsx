import { useCallback, useMemo } from "react";

import { CommandGroup, CommandItem } from "@/components/ui/command";

import { useFilterBuilder } from "../context";
import type {
  FilterBaseOption,
  FilterBooleanConfig,
  FilterConfig,
  FilterConfigItemsRenderProps,
} from "../types";

export const FilterBooleanRenderer = ({
  filter,
  currentID,
}: FilterConfigItemsRenderProps<FilterBooleanConfig>) => {
  const { addFilter, updateFilter, value, doesFilterExist } =
    useFilterBuilder("FilterBooleanRenderer");

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
      updateFilter(currentID, [option]);
    },
    [addFilter, updateFilter, doesFilterExist, currentID],
  );

  const { isInverse = false, trueValueLabel, falseValueLabel } =
    filter.context ?? {};

  const trueLabel = trueValueLabel ?? (isInverse ? "False" : "True");
  const falseLabel = falseValueLabel ?? (isInverse ? "True" : "False");

  const items = [
    <CommandItem
      key="true"
      value={trueLabel}
      onSelect={() =>
        addOrUpdateFilter(filter, {
          id: "true",
          label: trueLabel,
          value: !isInverse,
        })
      }
    >
      {currentFilter?.value[0]?.id === "true" ? `✓ ${trueLabel}` : trueLabel}
    </CommandItem>,
    <CommandItem
      key="false"
      value={falseLabel}
      onSelect={() =>
        addOrUpdateFilter(filter, {
          id: "false",
          label: falseLabel,
          value: isInverse,
        })
      }
    >
      {currentFilter?.value[0]?.id === "false" ? `✓ ${falseLabel}` : falseLabel}
    </CommandItem>,
  ];
  if (isInverse) items.reverse();

  return <CommandGroup>{items}</CommandGroup>;
};
