import { Tooltip } from "@mantine/core";
import { ListFilterPlus, LockIcon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/class-names";

import { Button } from "./button";

import styles from "./filter.module.scss";

type FilterAddButtonProps = ComponentProps<"button"> & {
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
      variant="outline"
      aria-label="Add filter"
      data-slot="filter-add-button"
      data-has-filters={hasFilters ? "" : undefined}
      rightSection={<ListFilterPlus size={12} aria-hidden="true" />}
      className={cn(styles.addButton, className)}
      {...props}
    >
      Filter
    </Button>
  );
}

function FilterContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="filter"
      className={cn(styles.container, className)}
      {...props}
    />
  );
}

function FilterBox({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-box"
      className={cn(styles.box, className)}
      {...props}
    />
  );
}

function FilterProperty({
  className,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type={type}
      data-slot="filter-property"
      className={cn(styles.segment, className)}
      {...props}
    />
  );
}

function FilterCondition({
  className,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type={type}
      data-slot="filter-condition"
      className={cn(styles.segment, styles.condition, className)}
      {...props}
    />
  );
}

function FilterPredicate({
  className,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type={type}
      data-slot="filter-predicate"
      className={cn(styles.segment, className)}
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
    <div className={styles.closeLockWrapper}>
      <Tooltip label={label} openDelay={200} withinPortal>
        {isLocked ? (
          <span
            role="img"
            aria-label={label}
            data-slot="filter-lock"
            className={cn(styles.segment, styles.closeLock, styles.locked)}
          >
            <LockIcon size={12} aria-hidden="true" />
          </span>
        ) : (
          <button
            type="button"
            onClick={onClick}
            aria-label={label}
            data-slot="filter-remove"
            className={cn(styles.segment, styles.closeLock)}
          >
            <XIcon size={12} aria-hidden="true" />
          </button>
        )}
      </Tooltip>
    </div>
  );
}

export const Filter = Object.assign(FilterContainer, {
  AddButton: FilterAddButton,
  Box: FilterBox,
  Property: FilterProperty,
  Condition: FilterCondition,
  Predicate: FilterPredicate,
  CloseLock: FilterCloseLock,
});

export {
  FilterAddButton,
  FilterContainer,
  FilterBox,
  FilterProperty,
  FilterCondition,
  FilterPredicate,
  FilterCloseLock,
};
