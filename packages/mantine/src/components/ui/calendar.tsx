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
        // @mantine/dates v8 typing: `DateValue = string | Date | null`. The
        // string form is the default; the Date form appears with custom config.
        const date = next instanceof Date ? next : new Date(next);
        if (!Number.isNaN(date.getTime())) onDateChange?.(date);
      }}
      firstDayOfWeek={1}
    />
  );
}
