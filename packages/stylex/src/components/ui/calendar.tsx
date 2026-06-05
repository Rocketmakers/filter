import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker, useDayPicker } from "react-day-picker";
import { format } from "date-fns";
import * as stylex from "@stylexjs/stylex";

import { radii, spacing, text } from "@/constants.stylex";
import { colors } from "@/tokens.stylex";

import { Button } from "./button";

export type CalendarPickerProps = {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  disablePastDates?: boolean;
};

const formatMonthHeading = (date: Date) => format(date, "MMMM yyyy");

const styles = stylex.create({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    gap: spacing.sm,
    userSelect: "none",
    maxWidth: "20rem",
  },
  picker: {
    position: "relative",
  },
  dayButton: {
    transitionProperty: "background-color, color, border-color",
    transitionDuration: "0.15s",
    borderRadius: radii.lg,
    backgroundColor: "transparent",
    width: "2rem",
    height: "2rem",
    paddingInline: 0,
  },
  daySelected: {
    fontWeight: 600,
    backgroundColor: colors.accent,
    color: colors.accentForeground,
  },
  dayToday: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.input,
  },
  dayOutside: {
    color: colors.mutedForeground,
    opacity: 0.4,
  },
  dayLabel: {
    fontSize: text.xs,
  },
  weekday: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "2.5rem",
    textAlign: "center",
    fontSize: text.xs,
    color: colors.mutedForeground,
  },
  weekdaysHead: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  weekdaysRow: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
  },
  weekRow: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
  },
  monthCaption: {
    textAlign: "center",
    paddingTop: "0.25rem",
    fontSize: text.sm,
    fontWeight: 600,
  },
  monthGrid: {
    width: "100%",
    display: "grid",
    gridTemplateRows: "min-content 1fr",
    paddingTop: spacing.sm,
  },
  nav: {
    position: "absolute",
    top: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: "fit-content",
    gap: spacing.sm,
  },
  navBtn: {
    width: "1.75rem",
    height: "1.75rem",
  },
});

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
    <div {...stylex.props(styles.wrapper)}>
      <DayPicker
        disabled={disablePastDates ? { before: new Date() } : undefined}
        today={new Date()}
        month={month}
        onMonthChange={setMonth}
        {...stylex.props(styles.picker)}
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
                onClick={onClick}
                disabled={isDisabled}
                {...stylex.props(
                  styles.dayButton,
                  isSelected && styles.daySelected,
                  isToday && !isSelected && styles.dayToday,
                  isOutside && styles.dayOutside,
                )}
              >
                <span {...stylex.props(styles.dayLabel)}>{children}</span>
              </Button>
            );
          },
          Weekday: ({ children }) => (
            <td {...stylex.props(styles.weekday)}>{children}</td>
          ),
          Weekdays: ({ children }) => (
            <thead {...stylex.props(styles.weekdaysHead)}>
              <tr {...stylex.props(styles.weekdaysRow)}>{children}</tr>
            </thead>
          ),
          Week: ({ children }) => (
            <tr {...stylex.props(styles.weekRow)}>{children}</tr>
          ),
          MonthCaption: ({ calendarMonth }) => (
            <h5 {...stylex.props(styles.monthCaption)}>
              {formatMonthHeading(calendarMonth.date)}
            </h5>
          ),
          MonthGrid: ({ children }) => (
            <table {...stylex.props(styles.monthGrid)}>{children}</table>
          ),
          Nav: () => {
            const dayPicker = useDayPicker();
            return (
              <div {...stylex.props(styles.nav)}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (dayPicker.previousMonth)
                      dayPicker.goToMonth(dayPicker.previousMonth);
                  }}
                  {...stylex.props(styles.navBtn)}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (dayPicker.nextMonth)
                      dayPicker.goToMonth(dayPicker.nextMonth);
                  }}
                  {...stylex.props(styles.navBtn)}
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
