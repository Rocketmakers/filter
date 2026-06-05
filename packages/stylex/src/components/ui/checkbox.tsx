import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "lucide-react";
import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";

import { radii } from "@/constants.stylex";
import { colors } from "@/tokens.stylex";
import { sx } from "@/lib/sx";

const styles = stylex.create({
  root: {
    width: "1rem",
    height: "1rem",
    flexShrink: 0,
    borderRadius: "0.25rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.input,
    backgroundColor: {
      default: "transparent",
      ':is([data-state="checked"])': colors.primary,
    },
    color: {
      default: colors.foreground,
      ':is([data-state="checked"])': colors.primaryForeground,
    },
    cursor: "pointer",
    padding: 0,
    transition: "background-color 0.15s ease",
  },
  indicator: {
    display: "grid",
    placeContent: "center",
    color: "currentColor",
  },
  icon: {
    width: "0.875rem",
    height: "0.875rem",
  },
});

void radii;

export function Checkbox({
  className,
  ...props
}: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      {...sx([styles.root], className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator {...stylex.props(styles.indicator)}>
        <CheckIcon {...stylex.props(styles.icon)} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
