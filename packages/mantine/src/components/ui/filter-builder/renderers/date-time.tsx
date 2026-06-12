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

import styles from "./date-time.module.scss";

const NUMBER_WORDS: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  eleven: "11", twelve: "12",
};

// chrono's casual parser handles word-form numbers ("three months") but is
// flakier on digit-form phrases ("in 3 months time"). Generate both variants
// so either phrasing resolves to a date.
const variantsOf = (input: string): string[] => {
  const trimmed = input.trim();
  const variants = new Set<string>([trimmed]);
  variants.add(
    trimmed.replace(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi,
      (m) => NUMBER_WORDS[m.toLowerCase()] ?? m,
    ),
  );
  variants.add(trimmed.replace(/\s+time\b/i, ""));
  return Array.from(variants);
};

const parseNaturalDateTime = (input: string): Date | null => {
  if (!input.trim()) return null;
  const locale = typeof navigator !== "undefined" ? navigator.language : "en";
  const parser = locale === "en-GB" ? chrono.en.GB : chrono.en;
  for (const variant of variantsOf(input)) {
    const result = parser.parseDate(variant);
    if (result) return result;
  }
  return null;
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

  const parsedDateTime = useMemo(
    () => parseNaturalDateTime(inputValue),
    [inputValue],
  );

  const shortcuts = filter.shortcuts ?? [];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addOrUpdateFilter, filter, selectedDateTime],
  );

  return (
    <div className={styles.layout}>
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
          {shortcuts.map((shortcut) => (
            <CommandItem
              key={shortcut.id}
              value={shortcut.label}
              onSelect={() => {
                const base = shortcut.build();
                const next = new Date(base);
                if (selectedDateTime) {
                  next.setHours(
                    selectedDateTime.getHours(),
                    selectedDateTime.getMinutes(),
                    0,
                    0,
                  );
                  // Time was picked explicitly — show the full datetime so the
                  // user sees what they chose.
                  addOrUpdateFilter(filter, {
                    id: shortcut.id,
                    label: formatLabel(next),
                    value: next,
                  });
                  return;
                }
                // No time set yet — keep the shortcut phrasing and suffix
                // "'s date" so the box reads e.g. "has one on Today's date".
                addOrUpdateFilter(filter, {
                  id: shortcut.id,
                  label: `${shortcut.label}'s date`,
                  value: next,
                });
              }}
            >
              {shortcut.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </div>
      <div className={styles.calendarPane}>
        <CalendarPicker
          selectedDate={selectedDateTime}
          onDateChange={(date) => {
            const next = new Date(date);
            if (selectedDateTime) {
              next.setHours(
                selectedDateTime.getHours(),
                selectedDateTime.getMinutes(),
                0,
                0,
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
        <div className={styles.timeRow}>
          <Label htmlFor="filter-time">Time</Label>
          <input
            id="filter-time"
            type="time"
            value={currentTimeString}
            onChange={(e) => updateTime(e.target.value)}
            className={styles.timeInput}
          />
        </div>
      </div>
    </div>
  );
};
