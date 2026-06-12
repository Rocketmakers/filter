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

import styles from "./date.module.scss";

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

const parseNaturalDate = (input: string): Date | null => {
  if (!input.trim()) return null;
  const locale = typeof navigator !== "undefined" ? navigator.language : "en";
  const parser = locale === "en-GB" ? chrono.en.GB : chrono.en;
  for (const variant of variantsOf(input)) {
    const result = parser.parseDate(variant);
    if (result) return result;
  }
  return null;
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

  const parsedDate = useMemo(() => parseNaturalDate(inputValue), [inputValue]);

  const shortcuts = filter.shortcuts ?? [];

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
    <div className={styles.layout}>
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
          {shortcuts.map((shortcut) => (
            <CommandItem
              key={shortcut.id}
              value={shortcut.label}
              onSelect={() => {
                const date = shortcut.build();
                addOrUpdateFilter(filter, {
                  id: shortcut.id,
                  // The shortcut label is a phrase ("Today", "A month ago"),
                  // so the box would read "has one on Today" which is ungrammatical.
                  // Appending "'s date" makes it read "has one on Today's date".
                  // The shortcut list itself keeps the unsuffixed phrase.
                  label: `${shortcut.label}'s date`,
                  value: date,
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
