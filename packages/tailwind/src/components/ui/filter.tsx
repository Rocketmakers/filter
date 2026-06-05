import * as React from "react";
import { ListFilterPlus, LockIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type FilterAddButtonProps = React.ComponentProps<"button"> & {
  /** Whether the filter row already has pills to the left — squares off the left edge. */
  hasFilters?: boolean;
};

function FilterAddButton({
  hasFilters,
  className,
  ...props
}: FilterAddButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label="Add filter"
      data-slot="filter-add-button"
      className={cn(
        "h-10 gap-1.5 border border-input text-muted-foreground [&_svg]:size-3",
        hasFilters && "rounded-l-none",
        className,
      )}
      {...props}
    >
      <span>Filter</span>
      <ListFilterPlus aria-hidden="true" />
    </Button>
  );
}

function FilterContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter"
      className={cn(
        "flex flex-row flex-wrap items-center",
        "*:bg-background",
        "[&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md",
        "[&>*:not(:first-child)]:border-l-0",
        className,
      )}
      {...props}
    />
  );
}

function FilterBox({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-box"
      className={cn(
        "flex h-10 items-center border border-input bg-background text-sm transition-colors",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        "[&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

const filterSegmentClasses = cn(
  "inline-flex h-full items-center gap-1.5 whitespace-nowrap px-2",
  "bg-transparent text-xs text-foreground",
  "outline-hidden transition-colors",
  "hover:bg-accent hover:text-accent-foreground",
  "focus-visible:bg-accent focus-visible:text-accent-foreground",
  "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
  "disabled:pointer-events-none disabled:opacity-50",
  "overflow-hidden text-ellipsis",
);

function FilterProperty({
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type={type}
      data-slot="filter-property"
      className={cn(filterSegmentClasses, className)}
      {...props}
    />
  );
}

function FilterCondition({
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type={type}
      data-slot="filter-condition"
      className={cn(
        filterSegmentClasses,
        "mx-1 h-6 rounded-sm bg-muted",
        className,
      )}
      {...props}
    />
  );
}

function FilterPredicate({
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type={type}
      data-slot="filter-predicate"
      className={cn(filterSegmentClasses, className)}
      {...props}
    />
  );
}

type FilterCloseLockProps = {
  type: "lock" | "remove";
  onClick?: () => void;
};

function FilterCloseLock({ type, onClick }: FilterCloseLockProps) {
  const isLocked = type === "lock";
  const label = isLocked ? "This filter is locked" : "Remove filter";

  return (
    <div className="mr-1 flex h-7 flex-1 items-center justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          {isLocked ? (
            <span
              role="img"
              aria-label={label}
              data-slot="filter-lock"
              className={cn(
                filterSegmentClasses,
                "h-full rounded-full px-1.5 hover:bg-transparent",
              )}
            >
              <LockIcon aria-hidden="true" />
            </span>
          ) : (
            <button
              type="button"
              onClick={onClick}
              aria-label={label}
              data-slot="filter-remove"
              className={cn(filterSegmentClasses, "h-full rounded-full px-1.5")}
            >
              <XIcon aria-hidden="true" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </div>
  );
}

const Filter = Object.assign(FilterContainer, {
  AddButton: FilterAddButton,
  Box: FilterBox,
  Property: FilterProperty,
  Condition: FilterCondition,
  Predicate: FilterPredicate,
  CloseLock: FilterCloseLock,
});

export {
  Filter,
  FilterAddButton,
  FilterContainer,
  FilterBox,
  FilterProperty,
  FilterCondition,
  FilterPredicate,
  FilterCloseLock,
};
