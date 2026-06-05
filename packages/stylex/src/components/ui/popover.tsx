import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";

import { radii, shadows } from "@/constants.stylex";
import { colors } from "@/tokens.stylex";
import { sx } from "@/lib/sx";

const styles = stylex.create({
  content: {
    zIndex: 50,
    width: "18rem",
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
    backgroundColor: colors.popover,
    color: colors.popoverForeground,
    boxShadow: shadows.md,
    outline: "none",
    overflow: "hidden",
  },
});

export function Popover({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export function PopoverTrigger({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        {...sx([styles.content], className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
