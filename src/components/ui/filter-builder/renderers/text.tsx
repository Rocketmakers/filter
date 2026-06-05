import { useCallback, useMemo } from "react";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";

import { useFilterBuilder } from "../context";
import type { FilterConfigItemsRenderProps, FilterTextConfig } from "../types";

export const FilterTextRenderer = ({
  filter,
  inputValue,
  currentID,
}: FilterConfigItemsRenderProps<FilterTextConfig>) => {
  const { addFilter, updateFilter, doesFilterExist } =
    useFilterBuilder("FilterTextRenderer");

  const onSelect = useCallback(
    (selected: string) => {
      const option = { id: "text-value", label: selected, value: selected };
      if (doesFilterExist(currentID)) {
        updateFilter(currentID, [option]);
        return;
      }
      addFilter(currentID, filter, [option]);
    },
    [addFilter, updateFilter, doesFilterExist, currentID, filter]
  );

  const customOptionMatchesInput = useMemo(
    () =>
      !!filter.customOptions?.some(
        (option) => option.label.toLowerCase() === inputValue.toLowerCase()
      ),
    [filter.customOptions, inputValue]
  );

  return (
    <>
      <CommandGroup>
        {inputValue && !customOptionMatchesInput && (
          <CommandItem
            key="text-value"
            value={inputValue}
            onSelect={() => onSelect(inputValue)}
          >
            <Label>Text value:</Label>
            {inputValue}
          </CommandItem>
        )}
      </CommandGroup>
      {filter.customOptions && filter.customOptions.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup>
            {filter.customOptions.map((option) => (
              <CommandItem
                key={option.id}
                value={option.label}
                onSelect={() => onSelect(String(option.value ?? option.label))}
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
