import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";

import { radii, shadows, spacing, text } from "@/constants.stylex";
import { colors } from "@/tokens.stylex";
import { sx } from "@/lib/sx";

const styles = stylex.create({
  content: {
    zIndex: 50,
    minWidth: "8rem",
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
    backgroundColor: colors.popover,
    color: colors.popoverForeground,
    padding: spacing.xs,
    boxShadow: shadows.md,
    overflowX: "hidden",
    overflowY: "auto",
  },
  item: {
    position: "relative",
    display: "flex",
    cursor: "default",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.sm,
    paddingBlock: "0.375rem",
    paddingInline: spacing.sm,
    fontSize: text.sm,
    outline: "none",
    userSelect: "none",
    backgroundColor: {
      default: "transparent",
      ":focus": colors.accent,
    },
    color: {
      default: colors.foreground,
      ":focus": colors.accentForeground,
    },
  },
});

export function DropdownMenu({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

export function DropdownMenuTrigger({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
  );
}

export function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        {...sx([styles.content], className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      {...sx([styles.item], className)}
      {...props}
    />
  );
}
