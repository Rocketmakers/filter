import { ListFilterPlus, LockIcon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";

import { radii, spacing, text } from "@/constants.stylex";
import { colors } from "@/tokens.stylex";
import { sx } from "@/lib/sx";

import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const styles = stylex.create({
  container: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  box: {
    display: "flex",
    height: "2.5rem",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderStyle: "solid",
    borderColor: colors.input,
    backgroundColor: colors.background,
    fontSize: text.sm,
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "0.15s",
  },
  boxFirst: {
    borderTopLeftRadius: radii.md,
    borderBottomLeftRadius: radii.md,
  },
  boxLast: {
    borderTopRightRadius: radii.md,
    borderBottomRightRadius: radii.md,
  },
  boxNotFirst: {
    borderLeftWidth: 0,
  },
  segment: {
    display: "inline-flex",
    height: "100%",
    alignItems: "center",
    gap: "0.375rem",
    whiteSpace: "nowrap",
    paddingInline: spacing.sm,
    paddingBlock: 0,
    backgroundColor: {
      default: "transparent",
      ":hover": colors.accent,
      ":focus-visible": colors.accent,
      ':is([data-state="open"])': colors.accent,
    },
    color: {
      default: colors.foreground,
      ":hover": colors.accentForeground,
      ":focus-visible": colors.accentForeground,
      ':is([data-state="open"])': colors.accentForeground,
    },
    fontSize: text.xs,
    fontFamily: "inherit",
    borderWidth: 0,
    cursor: "pointer",
    // Explicit per-state outline kills the UA `:focus-visible` ring on every
    // pseudo-state — leaving it as a plain `outline: 'none'` was being beaten
    // by the layered UA rule on some browsers.
    outlineStyle: {
      default: "none",
      ":focus": "none",
      ":focus-visible": "none",
    },
    transitionProperty: "background-color, color",
    transitionDuration: "0.15s",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  condition: {
    marginInline: "0.25rem",
    height: "1.5rem",
    borderRadius: radii.sm,
    backgroundColor: {
      default: colors.muted,
      ":hover": colors.accent,
      ":focus-visible": colors.accent,
      ':is([data-state="open"])': colors.accent,
    },
  },
  closeLockWrapper: {
    display: "flex",
    height: "1.75rem",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "0.25rem",
  },
  closeLock: {
    height: "100%",
    borderRadius: radii.full,
    paddingInline: "0.375rem",
  },
  locked: {
    backgroundColor: { default: "transparent", ":hover": "transparent" },
  },
  addButton: {
    height: "2.5rem",
    gap: "0.375rem",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderStyle: "solid",
    borderColor: colors.input,
    color: colors.mutedForeground,
  },
  addButtonFirst: {
    borderTopLeftRadius: radii.md,
    borderBottomLeftRadius: radii.md,
  },
  addButtonLast: {
    borderTopRightRadius: radii.md,
    borderBottomRightRadius: radii.md,
  },
  addButtonNotFirst: {
    borderLeftWidth: 0,
  },
  iconSm: {
    width: "0.75rem",
    height: "0.75rem",
    flexShrink: 0,
  },
});

type PillPosition = {
  /** True when this pill is the leftmost child of the Filter container. */
  isFirst?: boolean;
  /** True when this pill is the rightmost child of the Filter container. */
  isLast?: boolean;
};

type FilterAddButtonProps = ComponentProps<"button"> & PillPosition;

function FilterAddButton({
  isFirst,
  isLast,
  className,
  ...props
}: FilterAddButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label="Add filter"
      data-slot="filter-add-button"
      {...sx(
        [
          styles.addButton,
          isFirst && styles.addButtonFirst,
          isLast && styles.addButtonLast,
          !isFirst && styles.addButtonNotFirst,
        ],
        className,
      )}
      {...props}
    >
      <span>Filter</span>
      <ListFilterPlus {...stylex.props(styles.iconSm)} aria-hidden="true" />
    </Button>
  );
}

function FilterContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="filter"
      {...sx([styles.container], className)}
      {...props}
    />
  );
}

type FilterBoxProps = ComponentProps<"div"> & PillPosition;

function FilterBox({ isFirst, isLast, className, ...props }: FilterBoxProps) {
  return (
    <div
      data-slot="filter-box"
      {...sx(
        [
          styles.box,
          isFirst && styles.boxFirst,
          isLast && styles.boxLast,
          !isFirst && styles.boxNotFirst,
        ],
        className,
      )}
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
      {...sx([styles.segment], className)}
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
      {...sx([styles.segment, styles.condition], className)}
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
      {...sx([styles.segment], className)}
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
    <div {...stylex.props(styles.closeLockWrapper)}>
      <Tooltip>
        <TooltipTrigger asChild>
          {isLocked ? (
            <span
              role="img"
              aria-label={label}
              data-slot="filter-lock"
              {...stylex.props(styles.segment, styles.closeLock, styles.locked)}
            >
              <LockIcon {...stylex.props(styles.iconSm)} aria-hidden="true" />
            </span>
          ) : (
            <button
              type="button"
              onClick={onClick}
              aria-label={label}
              data-slot="filter-remove"
              {...stylex.props(styles.segment, styles.closeLock)}
            >
              <XIcon {...stylex.props(styles.iconSm)} aria-hidden="true" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
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
