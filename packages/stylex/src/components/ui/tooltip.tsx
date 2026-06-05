import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";

import { radii, spacing, text } from "@/constants.stylex";
import { colors } from "@/tokens.stylex";
import { sx } from "@/lib/sx";

const styles = stylex.create({
  content: {
    zIndex: 50,
    width: "fit-content",
    borderRadius: radii.md,
    backgroundColor: colors.foreground,
    color: colors.background,
    paddingInline: spacing.md,
    paddingBlock: "0.375rem",
    fontSize: text.xs,
    textWrap: "balance",
  },
  arrow: {
    fill: colors.foreground,
  },
});

export function TooltipProvider({
  delayDuration = 0,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

export function Tooltip({
  ...props
}: ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

export function TooltipTrigger({
  ...props
}: ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

export function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        {...sx([styles.content], className)}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow {...stylex.props(styles.arrow)} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
