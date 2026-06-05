import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";

import { spacing, text } from "@/constants.stylex";
import { colors } from "@/tokens.stylex";
import { sx } from "@/lib/sx";

const styles = stylex.create({
  label: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    fontSize: text.sm,
    lineHeight: 1,
    fontWeight: 500,
    userSelect: "none",
    color: colors.foreground,
  },
});

export function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      {...sx([styles.label], className)}
      {...props}
    />
  );
}
