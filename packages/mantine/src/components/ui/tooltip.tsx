/**
 * Mantine Tooltip needs no provider — the API is `<Tooltip label="...">child</Tooltip>`.
 * We export the same names the Tailwind variant uses so consumers can pattern-match.
 */
import { Tooltip as MTooltip, type TooltipProps } from "@mantine/core";

export const Tooltip = MTooltip;

/** Compatibility shim — Mantine doesn't need a Provider but the demo app may render one. */
export const TooltipProvider = ({
  children,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) => <>{children}</>;

export type { TooltipProps };
