import { DatePicker } from "@mantine/dates";
import { useEffect, useState } from "react";

export type CalendarPickerProps = {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
};

/**
 * Mantine-backed equivalent of the Tailwind variant's `CalendarPicker`.
 * Uses @mantine/dates' `DatePicker` (the higher-level "calendar with selection
 * state" primitive) so we don't have to rebuild day-rendering plumbing.
 */
export function CalendarPicker({
  selectedDate,
  onDateChange,
}: CalendarPickerProps) {
  // Control the visible month so shortcut selections (e.g. "A month ago")
  // jump the calendar to that month instead of leaving it on today's.
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    selectedDate ?? new Date(),
  );

  useEffect(() => {
    if (selectedDate) setVisibleMonth(selectedDate);
  }, [selectedDate]);

  return (
    <DatePicker
      value={selectedDate ?? null}
      date={visibleMonth}
      onDateChange={(next) => {
        const date = typeof next === "string" ? new Date(next) : next;
        if (date && !Number.isNaN(date.getTime())) setVisibleMonth(date);
      }}
      onChange={(next) => {
        if (!next) return;
        const date = typeof next === "string" ? new Date(next) : next;
        if (!Number.isNaN(date.getTime())) onDateChange?.(date);
      }}
      firstDayOfWeek={1}
      weekendDays={[]}
    />
  );
}
