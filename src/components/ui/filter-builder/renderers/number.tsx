import { useCallback } from "react";
import { toast } from "sonner";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";

import { useFilterBuilder } from "../context";
import type { FilterConfigItemsRenderProps, FilterNumberConfig } from "../types";

export const FilterNumberRenderer = ({
  filter,
  inputValue,
  currentID,
}: FilterConfigItemsRenderProps<FilterNumberConfig>) => {
  const { addFilter, updateFilter, doesFilterExist } =
    useFilterBuilder("FilterNumberRenderer");

  const onSelect = useCallback(() => {
    if (inputValue === "") return;
    const numeric = Number(inputValue);
    if (Number.isNaN(numeric)) {
      toast.error("Please enter a valid number");
      return;
    }
    if (filter.minNumber !== undefined && numeric < filter.minNumber) {
      toast.error(`Minimum value is ${filter.minNumber}`);
      return;
    }
    if (filter.maxNumber !== undefined && numeric > filter.maxNumber) {
      toast.error(`Maximum value is ${filter.maxNumber}`);
      return;
    }

    const option = {
      id: "number-value",
      label: inputValue,
      value: numeric,
    };
    if (doesFilterExist(currentID)) {
      updateFilter(currentID, [option]);
      return;
    }
    addFilter(currentID, filter, [option]);
  }, [
    inputValue,
    addFilter,
    updateFilter,
    doesFilterExist,
    currentID,
    filter,
  ]);

  return (
    <>
      {inputValue && (
        <CommandGroup>
          <CommandItem value={inputValue} onSelect={onSelect}>
            <Label>Number:</Label>
            {inputValue}
          </CommandItem>
        </CommandGroup>
      )}
      {filter.customOptions && filter.customOptions.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup>
            {filter.customOptions.map((option) => (
              <CommandItem
                key={option.id}
                value={option.label}
                onSelect={() => {
                  if (doesFilterExist(currentID)) {
                    updateFilter(currentID, [option]);
                  } else {
                    addFilter(currentID, filter, [option]);
                  }
                }}
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
