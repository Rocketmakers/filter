import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";

import { radii, spacing, text } from "@/constants.stylex";
import { colors } from "@/tokens.stylex";
import { sx } from "@/lib/sx";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

const styles = stylex.create({
  base: {
    display: "inline-flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    fontSize: text.sm,
    fontWeight: 500,
    whiteSpace: "nowrap",
    transitionProperty: "background-color, color, box-shadow, border-color",
    transitionDuration: "0.15s",
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    borderWidth: 0,
    borderStyle: "solid",
    borderColor: "transparent",
  },
  default: {
    backgroundColor: colors.primary,
    color: colors.primaryForeground,
  },
  destructive: {
    backgroundColor: colors.destructive,
    color: colors.destructiveForeground,
  },
  outline: {
    backgroundColor: colors.background,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondary: {
    backgroundColor: colors.muted,
    color: colors.foreground,
  },
  ghost: {
    backgroundColor: {
      default: "transparent",
      ":hover": colors.accent,
    },
    color: {
      default: colors.foreground,
      ":hover": colors.accentForeground,
    },
  },
  link: {
    backgroundColor: "transparent",
    color: colors.primary,
    textDecoration: "underline",
  },
  sizeDefault: {
    height: "2.25rem",
    paddingInline: spacing.lg,
    paddingBlock: spacing.sm,
  },
  sizeXs: {
    height: "1.5rem",
    paddingInline: spacing.sm,
    fontSize: text.xs,
    borderRadius: radii.md,
  },
  sizeSm: {
    height: "2rem",
    paddingInline: spacing.md,
  },
  sizeLg: {
    height: "2.5rem",
    paddingInline: spacing.xl,
  },
  sizeIcon: {
    width: "2.25rem",
    height: "2.25rem",
    paddingInline: 0,
  },
  sizeIconXs: {
    width: "1.5rem",
    height: "1.5rem",
    paddingInline: 0,
    borderRadius: radii.md,
  },
  sizeIconSm: {
    width: "2rem",
    height: "2rem",
    paddingInline: 0,
  },
  sizeIconLg: {
    width: "2.5rem",
    height: "2.5rem",
    paddingInline: 0,
  },
  disabled: {
    pointerEvents: "none",
    opacity: 0.5,
  },
});

const variantStyle: Record<Variant, stylex.StyleXStyles> = {
  default: styles.default,
  destructive: styles.destructive,
  outline: styles.outline,
  secondary: styles.secondary,
  ghost: styles.ghost,
  link: styles.link,
};

const sizeStyle: Record<Size, stylex.StyleXStyles> = {
  default: styles.sizeDefault,
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  lg: styles.sizeLg,
  icon: styles.sizeIcon,
  "icon-xs": styles.sizeIconXs,
  "icon-sm": styles.sizeIconSm,
  "icon-lg": styles.sizeIconLg,
};

export type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      {...sx(
        [styles.base, variantStyle[variant], sizeStyle[size], disabled && styles.disabled],
        className,
      )}
      {...props}
    />
  );
}
