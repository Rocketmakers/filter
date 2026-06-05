type ClassName = string | undefined | null | false | Record<string, boolean>;

/** sponsorreporting2-style class concatenator. Replaces shadcn's `cn`. */
export function cn(...args: ClassName[]): string {
  const classes: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === "string") {
      classes.push(arg);
    } else if (typeof arg === "object") {
      for (const key of Object.keys(arg)) {
        if (arg[key]) classes.push(key);
      }
    }
  }
  return classes.join(" ");
}
