/**
 * Thin re-export of Mantine's Popover so the filter-builder folder can import
 * `Popover` from `@/components/ui/popover` the same way the Tailwind variant
 * does (just from a Mantine-backed module instead of a Radix one).
 */
import { Popover as MPopover } from "@mantine/core";

export const Popover = MPopover;
export const PopoverTarget = MPopover.Target;
export const PopoverDropdown = MPopover.Dropdown;
