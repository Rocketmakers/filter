import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/class-names";

import styles from "./command.module.scss";

/**
 * cmdk wrappers, kept identical to the Tailwind variant's API so the
 * filter-builder logic doesn't fork. Styling moves to command.module.scss
 * referencing CSS custom properties so dark mode follows Mantine's scheme.
 */

export function Command({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(styles.command, className)}
      {...props}
    />
  );
}

export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className={styles.inputWrapper}>
      <SearchIcon className={styles.inputIcon} aria-hidden="true" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(styles.input, className)}
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
      className={cn(styles.list, className)}
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
      className={styles.empty}
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
      className={cn(styles.group, className)}
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
      className={cn(styles.separator, className)}
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
      className={cn(styles.item, className)}
      {...props}
    />
  );
}
