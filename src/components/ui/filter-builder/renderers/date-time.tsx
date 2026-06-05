import * as chrono from "chrono-node";
import { format } from "date-fns";
import { useCallback, useMemo } from "react";

import { CalendarPicker } from "@/components/ui/calendar";
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";

import { useFilterBuilder } from "../context";
import type {
  FilterBaseOption,
  FilterConfig,
  FilterConfigItemsRenderProps,
  FilterDateTimeConfig,
} from "../types";

const parseNaturalDateTime = (input: string): Date | null => {
  if (!input.trim()) return null;
  const locale = typeof navigator !== "undefined" ? navigator.language : "en";
  if (locale === "en-GB") return chrono.en.GB.parseDate(input);
  return chrono.en.parseDate(input);
};

export const FilterDateTimeRenderer = ({
  filter,
  inputValue,
  currentID,
}: FilterConfigItemsRenderProps<FilterDateTimeConfig>) => {
  const { addFilter, updateFilter, value, doesFilterExist } =
    useFilterBuilder("FilterDateTimeRenderer");

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

  const parsedDateTime = useMemo(
    () => parseNaturalDateTime(inputValue),
    [inputValue]
  );

  const selectedDateTime = useMemo(() => {
    const raw = currentFilter?.value[0]?.value;
    if (raw instanceof Date) return raw;
    if (typeof raw === "string") {
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  }, [currentFilter]);

  const formatLabel = (date: Date) =>
    filter.formatDate ? filter.formatDate(date) : format(date, "PP p");

  const currentTimeString = useMemo(() => {
    if (!selectedDateTime) return "12:00";
    return format(selectedDateTime, "HH:mm");
  }, [selectedDateTime]);

  const updateTime = useCallback(
    (timeStr: string) => {
      const [hoursStr, minutesStr] = timeStr.split(":");
      const hours = Number(hoursStr);
      const minutes = Number(minutesStr);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return;
      const base = selectedDateTime ?? new Date();
      const next = new Date(base);
      next.setHours(hours, minutes, 0, 0);
      addOrUpdateFilter(filter, {
        id: "custom",
        label: formatLabel(next),
        value: next,
      });
    },
    // formatLabel depends on filter only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addOrUpdateFilter, filter, selectedDateTime]
  );

  return (
    <div className="grid grid-cols-[13rem_20rem] w-full">
      <div>
        <CommandEmpty>
          Type a datetime — e.g. "tomorrow 9am" or "01/01/2025 14:30"
        </CommandEmpty>
        <CommandGroup heading="Shortcuts">
          {parsedDateTime && (
            <CommandItem
              key="custom"
              value={`${inputValue} (custom)`}
              onSelect={() => {
                addOrUpdateFilter(filter, {
                  id: "custom",
                  label: formatLabel(parsedDateTime),
                  value: parsedDateTime,
                });
              }}
            >
              {formatLabel(parsedDateTime)}
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
      <div className="w-full border-l flex flex-col items-stretch ml-1 box-border p-3 gap-3">
        <CalendarPicker
          selectedDate={selectedDateTime}
          onDateChange={(date) => {
            const next = new Date(date);
            if (selectedDateTime) {
              next.setHours(
                selectedDateTime.getHours(),
                selectedDateTime.getMinutes(),
                0,
                0
              );
            } else {
              next.setHours(12, 0, 0, 0);
            }
            addOrUpdateFilter(filter, {
              id: "custom",
              label: formatLabel(next),
              value: next,
            });
          }}
        />
        <div className="flex items-center gap-2 pl-1">
          <Label htmlFor="filter-time">Time</Label>
          <input
            id="filter-time"
            type="time"
            value={currentTimeString}
            onChange={(e) => updateTime(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          />
        </div>
      </div>
    </div>
  );
};
