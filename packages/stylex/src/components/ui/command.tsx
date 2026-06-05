import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";

import { radii, spacing, text } from "@/constants.stylex";
import { colors } from "@/tokens.stylex";
import { sx } from "@/lib/sx";

const styles = stylex.create({
  command: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: radii.md,
    backgroundColor: colors.popover,
    color: colors.popoverForeground,
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
    paddingInline: spacing.md,
    height: "2.25rem",
  },
  inputIcon: {
    width: "1rem",
    height: "1rem",
    flexShrink: 0,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    height: "2.5rem",
    backgroundColor: "transparent",
    // Longhand because StyleX's babel plugin silently drops the multi-value
    // shorthand `border: "none"` — without these, the input keeps its UA
    // default inset border that reads as a 1-2px gray rectangle.
    borderWidth: 0,
    borderStyle: "none",
    outlineStyle: "none",
    paddingBlock: spacing.md,
    fontSize: text.sm,
    color: colors.foreground,
    fontFamily: "inherit",
    "::placeholder": {
      color: colors.mutedForeground,
    },
  },
  list: {
    maxHeight: "18.75rem",
    overflowX: "hidden",
    overflowY: "auto",
    scrollPaddingBlock: spacing.xs,
  },
  empty: {
    paddingInline: spacing.md,
    paddingBlock: spacing.xl,
    textAlign: "center",
    fontSize: text.sm,
    color: colors.mutedForeground,
  },
  group: {
    padding: spacing.xs,
    color: colors.foreground,
    overflow: "hidden",
  },
  separator: {
    marginInline: `calc(-1 * ${spacing.xs})`,
    height: "1px",
    backgroundColor: colors.border,
  },
  item: {
    position: "relative",
    display: "flex",
    cursor: "default",
    alignItems: "center",
    gap: spacing.sm,
    paddingInline: spacing.sm,
    paddingBlock: "0.375rem",
    borderRadius: radii.sm,
    fontSize: text.sm,
    outline: "none",
    userSelect: "none",
    backgroundColor: {
      default: "transparent",
      ':is([data-selected="true"])': colors.accent,
    },
    color: {
      default: colors.foreground,
      ':is([data-selected="true"])': colors.accentForeground,
    },
  },
});

export function Command({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      {...sx([styles.command], className)}
      {...props}
    />
  );
}

export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" {...stylex.props(styles.inputWrapper)}>
      <SearchIcon {...stylex.props(styles.inputIcon)} aria-hidden="true" />
      <CommandPrimitive.Input
        data-slot="command-input"
        {...sx([styles.input], className)}
        {...props}
      />
    </div>
  );
}

export function CommandList({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      {...sx([styles.list], className)}
      {...props}
    />
  );
}

export function CommandEmpty(
  props: ComponentProps<typeof CommandPrimitive.Empty>,
) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      {...stylex.props(styles.empty)}
      {...props}
    />
  );
}

export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      {...sx([styles.group], className)}
      {...props}
    />
  );
}

export function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      {...sx([styles.separator], className)}
      {...props}
    />
  );
}

export function CommandItem({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      {...sx([styles.item], className)}
      {...props}
    />
  );
}
