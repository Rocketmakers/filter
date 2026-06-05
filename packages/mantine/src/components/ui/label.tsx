import type { ComponentProps } from "react";

import { cn } from "@/lib/class-names";

import styles from "./label.module.scss";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label data-slot="label" className={cn(styles.label, className)} {...props} />
  );
}
