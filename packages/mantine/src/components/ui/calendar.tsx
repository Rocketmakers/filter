import { DatePicker } from "@mantine/dates";

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
  return (
    <DatePicker
      value={selectedDate ?? null}
      onChange={(next) => {
        if (!next) return;
        const date = typeof next === "string" ? new Date(next) : next;
        if (!Number.isNaN(date.getTime())) onDateChange?.(date);
      }}
      firstDayOfWeek={1}
    />
  );
}
