import * as chrono from "chrono-node";
import { useCallback, useMemo } from "react";

import { CalendarPicker } from "@/components/ui/calendar";
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import { useFilterBuilder } from "../context";
import type {
  FilterBaseOption,
  FilterConfig,
  FilterConfigItemsRenderProps,
  FilterDateConfig,
} from "../types";

const parseNaturalDate = (input: string): Date | null => {
  if (!input.trim()) return null;
  const locale = typeof navigator !== "undefined" ? navigator.language : "en";
  if (locale === "en-GB") return chrono.en.GB.parseDate(input);
  return chrono.en.parseDate(input);
};

export const FilterDateRenderer = ({
  filter,
  inputValue,
  currentID,
}: FilterConfigItemsRenderProps<FilterDateConfig>) => {
  const { addFilter, updateFilter, value, doesFilterExist } =
    useFilterBuilder("FilterDateRenderer");

  const currentFilter = useMemo(
    () => value.find((f) => f.id === currentID),
    [value, currentID]
  );

  const addOrUpdateFilter = useCallback(
    (config: FilterConfig, option: FilterBaseOption) => {
      if (!doesFilterExist(currentID)) {
        addFilter(currentID, config, [option]);
        return;
      }
      updateFilter(currentID, [option]);
    },
    [addFilter, updateFilter, doesFilterExist, currentID]
  );

  const parsedDate = useMemo(() => parseNaturalDate(inputValue), [inputValue]);

  const selectedDate = useMemo(() => {
    const raw = currentFilter?.value[0]?.value;
    if (raw instanceof Date) return raw;
    if (typeof raw === "string") {
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  }, [currentFilter]);

  const formatDate = (date: Date) =>
    filter.formatDate ? filter.formatDate(date) : date.toDateString();

  return (
    <div className="grid grid-cols-[13rem_20rem] w-full">
      <div>
        <CommandEmpty>
          Type a date — e.g. "tomorrow", "in three months", or "1/1/2025"
        </CommandEmpty>
        <CommandGroup heading="Shortcuts">
          {parsedDate && (
            <CommandItem
              key="custom"
              value={`${inputValue} (custom)`}
              onSelect={() => {
                addOrUpdateFilter(filter, {
                  id: "custom",
                  label: formatDate(parsedDate),
                  value: parsedDate,
                });
              }}
            >
              {formatDate(parsedDate)}
            </CommandItem>
          )}
          {filter.customOptions?.map((option) => (
            <CommandItem
              key={option.id}
              value={option.label}
              onSelect={() => addOrUpdateFilter(filter, option)}
            >
              {option.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </div>
      <div className="w-full border-l flex items-start ml-1 justify-center box-border p-3">
        <CalendarPicker
          selectedDate={selectedDate}
          onDateChange={(date) =>
            addOrUpdateFilter(filter, {
              id: "custom",
              label: formatDate(date),
              value: date,
            })
          }
        />
      </div>
    </div>
  );
};
