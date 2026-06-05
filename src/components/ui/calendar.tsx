import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, useDayPicker } from "react-day-picker";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CalendarPickerProps = {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  disablePastDates?: boolean;
};

const formatMonthHeading = (date: Date) => format(date, "MMMM yyyy");

export const CalendarPicker = ({
  selectedDate,
  onDateChange,
  disablePastDates = false,
}: CalendarPickerProps) => {
  const [month, setMonth] = React.useState(selectedDate ?? new Date());

  React.useEffect(() => {
    if (selectedDate) setMonth(selectedDate);
  }, [selectedDate]);

  return (
    <div className="w-full h-full flex flex-col gap-2 select-none max-w-xs">
      <DayPicker
        disabled={disablePastDates ? { before: new Date() } : undefined}
        today={new Date()}
        month={month}
        onMonthChange={setMonth}
        className="relative"
        mode="single"
        selected={selectedDate}
        weekStartsOn={1}
        onSelect={(date) => {
          if (date) onDateChange?.(date);
        }}
        components={{
          DayButton: ({ day, onClick, disabled, children }) => {
            const isOutside = day.outside;
            const isToday =
              day.date.toDateString() === new Date().toDateString();
            const isSelected =
              !!selectedDate &&
              day.date.toDateString() === selectedDate.toDateString();
            const isDisabled = isOutside || disabled;
            return (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "transition-colors rounded-lg bg-transparent hover:bg-accent",
                  "focus:z-10 size-8",
                  isSelected &&
                    "font-semibold bg-accent text-accent-foreground",
                  isToday && !isSelected && "border border-input",
                  isOutside && "text-muted-foreground/40"
                )}
                onClick={onClick}
                disabled={isDisabled}
              >
                <span className="text-xs">{children}</span>
              </Button>
            );
          },
          Weekday: ({ children }) => (
            <td className="flex items-center justify-center h-10 text-center text-xs text-muted-foreground">
              {children}
            </td>
          ),
          Weekdays: ({ children }) => (
            <thead className="w-full flex items-center justify-center">
              <tr className="w-full grid grid-cols-7">{children}</tr>
            </thead>
          ),
          Week: ({ children }) => (
            <tr className="w-full grid grid-cols-7">{children}</tr>
          ),
          MonthCaption: ({ calendarMonth }) => (
            <h5 className="text-center pt-1 text-sm font-semibold">
              {formatMonthHeading(calendarMonth.date)}
            </h5>
          ),
          MonthGrid: ({ children }) => (
            <table className="w-full grid grid-rows-[min-content_1fr] pt-2">
              {children}
            </table>
          ),
          Nav: () => {
            const dayPicker = useDayPicker();
            return (
              <div className="absolute top-0 flex items-center justify-between w-full h-fit gap-2">
                <Button
                  onClick={() => {
                    if (dayPicker.previousMonth)
                      dayPicker.goToMonth(dayPicker.previousMonth);
                  }}
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  type="button"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  onClick={() => {
                    if (dayPicker.nextMonth)
                      dayPicker.goToMonth(dayPicker.nextMonth);
                  }}
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  type="button"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            );
          },
        }}
      />
    </div>
  );
};
