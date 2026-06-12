import { Badge } from "@mantine/core";
import { format } from "date-fns";
import {
  AtSignIcon,
  BadgeCheckIcon,
  BuildingIcon,
  CalendarDaysIcon,
  ClockIcon,
  DollarSignIcon,
  SparklesIcon,
  UserIcon,
  WrenchIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  baseFilterFields,
  type BaseSelectField,
  type Department,
  type Skill,
} from "@filter-builder/demo-code";

import type {
  FilterBaseOption,
  FilterObjectConfig,
  FilterOptionRegistry,
} from "@/components/ui/filter-builder";

/**
 * UI-specific overlays keyed by field name. The shared
 * `baseFilterFields` array in `@filter-builder/demo-code` is the source
 * of truth for everything UI-agnostic (name, label, type, search fns,
 * shortcuts). Here we add the Mantine bits — icons and Badge renderers.
 */
type FieldOverlay = {
  icon?: ReactNode;
  formatDate?: (date: Date) => string;
  filterSingleOptionRenderer?: (
    vals: FilterBaseOption<unknown>[],
  ) => ReactNode;
  filterMultipleOptionRenderer?: (
    vals: FilterBaseOption<unknown>[],
  ) => ReactNode;
  filterOptionRenderer?: (opt: FilterBaseOption<unknown>) => ReactNode;
};

const singleBadge = (vals: FilterBaseOption<unknown>[]) => (
  <Badge variant="light" radius="sm">
    {vals[0]?.label}
  </Badge>
);

const multiBadges = (vals: FilterBaseOption<unknown>[]) => (
  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
    {vals.slice(0, 2).map((v) => (
      <Badge key={v.id} variant="light" radius="sm">
        {v.label}
      </Badge>
    ))}
    {vals.length > 2 && (
      <Badge variant="light" radius="sm">
        +{vals.length - 2}
      </Badge>
    )}
  </div>
);

const selectRenderers: Pick<
  FieldOverlay,
  | "filterOptionRenderer"
  | "filterSingleOptionRenderer"
  | "filterMultipleOptionRenderer"
> = {
  filterOptionRenderer: (opt) => <span>{opt.label}</span>,
  filterSingleOptionRenderer: singleBadge,
  filterMultipleOptionRenderer: multiBadges,
};

const overlays: Record<string, FieldOverlay> = {
  name: { icon: <UserIcon size={14} /> },
  email: { icon: <AtSignIcon size={14} /> },
  department: { icon: <BuildingIcon size={14} />, ...selectRenderers },
  skills: { icon: <SparklesIcon size={14} />, ...selectRenderers },
  role: { icon: <WrenchIcon size={14} /> },
  salary: { icon: <DollarSignIcon size={14} /> },
  hireDate: {
    icon: <CalendarDaysIcon size={14} />,
    formatDate: (d) => format(d, "PP"),
  },
  lastLogin: {
    icon: <ClockIcon size={14} />,
    formatDate: (d) => format(d, "PP p"),
  },
  aliases: { icon: <UserIcon size={14} /> },
  quarterlyScores: { icon: <SparklesIcon size={14} /> },
  performanceReviewDates: {
    icon: <CalendarDaysIcon size={14} />,
    formatDate: (d) => format(d, "PP"),
  },
  shiftStarts: {
    icon: <ClockIcon size={14} />,
    formatDate: (d) => format(d, "PP p"),
  },
  isActive: { icon: <BadgeCheckIcon size={14} /> },
};

export const employeeFilters: FilterOptionRegistry = baseFilterFields.map(
  (base) => {
    const overlay = overlays[base.name] ?? {};

    if (base.type === "select") {
      const sel = base as BaseSelectField<Department | Skill>;
      return {
        ...sel,
        icon: overlay.icon,
        filterOptionRenderer:
          overlay.filterOptionRenderer ?? ((o) => <span>{o.label}</span>),
        filterSingleOptionRenderer:
          overlay.filterSingleOptionRenderer ?? singleBadge,
        filterMultipleOptionRenderer:
          overlay.filterMultipleOptionRenderer ?? multiBadges,
      } satisfies FilterObjectConfig<Department | Skill>;
    }

    return {
      ...base,
      icon: overlay.icon,
      ...(overlay.formatDate ? { formatDate: overlay.formatDate } : {}),
    };
  },
);
