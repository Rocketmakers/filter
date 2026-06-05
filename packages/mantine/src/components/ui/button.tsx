import { Button as MButton, type ButtonProps as MButtonProps } from "@mantine/core";

type Variant = "default" | "outline" | "ghost" | "subtle";
type Size = "default" | "xs" | "sm" | "lg" | "icon";

const variantMap: Record<Variant, MButtonProps["variant"]> = {
  default: "filled",
  outline: "default",
  ghost: "subtle",
  subtle: "subtle",
};

const sizeMap: Record<Size, MButtonProps["size"]> = {
  default: "sm",
  xs: "compact-xs",
  sm: "compact-sm",
  lg: "md",
  icon: "compact-sm",
};

export type ButtonProps = MButtonProps & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <MButton
      data-slot="button"
      data-variant={variant}
      data-size={size}
      variant={variantMap[variant]}
      size={sizeMap[size]}
      {...props}
    />
  );
}
