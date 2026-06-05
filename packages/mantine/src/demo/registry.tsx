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

import type {
  FilterBaseOption,
  FilterObjectConfig,
  FilterOptionRegistry,
} from "@/components/ui/filter-builder";

import { type Department, type Skill } from "./employees";
import {
  searchDepartments,
  searchSkills,
  searchSuggestions,
} from "./suggestions-api";

const departmentToOption = (dept: Department): FilterBaseOption<Department> => ({
  id: dept.id,
  label: dept.name,
  value: dept,
});

const skillToOption = (skill: Skill): FilterBaseOption<Skill> => ({
  id: skill.id,
  label: skill.name,
  value: skill,
});

const dateShortcuts = (): FilterBaseOption<Date>[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ago = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d;
  };
  const ahead = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };
  return [
    { id: "today", label: "Today", value: today },
    { id: "yesterday", label: "Yesterday", value: ago(1) },
    { id: "last-week", label: "1 week ago", value: ago(7) },
    { id: "last-month", label: "1 month ago", value: ago(30) },
    { id: "last-year", label: "1 year ago", value: ago(365) },
    { id: "next-week", label: "In 1 week", value: ahead(7) },
  ];
};

const dateTimeShortcuts = (): FilterBaseOption<Date>[] => {
  const now = new Date();
  const ago = (mins: number) => new Date(now.getTime() - mins * 60_000);
  return [
    { id: "now", label: "Right now", value: now },
    { id: "5m", label: "5 minutes ago", value: ago(5) },
    { id: "1h", label: "1 hour ago", value: ago(60) },
    {
      id: "today-9am",
      label: "Today 9am",
      value: (() => {
        const d = new Date(now);
        d.setHours(9, 0, 0, 0);
        return d;
      })(),
    },
    { id: "24h", label: "24 hours ago", value: ago(60 * 24) },
  ];
};

export const employeeFilters: FilterOptionRegistry = [
  {
    name: "name",
    label: "Name",
    type: "text",
    icon: <UserIcon size={14} />,
    filterSearch: (term) => searchSuggestions("name", term),
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    icon: <AtSignIcon size={14} />,
    filterSearch: (term) => searchSuggestions("email", term),
  },
  {
    name: "department",
    label: "Department",
    type: "select",
    icon: <BuildingIcon size={14} />,
    multiple: true,
    filterSearch: searchDepartments,
    mapToFilterOption: departmentToOption,
    filterOptionRenderer: (opt) => <span>{opt.label}</span>,
    filterSingleOptionRenderer: (vals) => (
      <Badge variant="light" radius="sm">
        {vals[0]?.label}
      </Badge>
    ),
    filterMultipleOptionRenderer: (vals) => (
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
    ),
  } satisfies FilterObjectConfig<Department>,
  {
    name: "skills",
    label: "Skills",
    type: "select",
    icon: <SparklesIcon size={14} />,
    multiple: true,
    multipleValues: true,
    filterSearch: searchSkills,
    mapToFilterOption: skillToOption,
    filterOptionRenderer: (opt) => <span>{opt.label}</span>,
    filterSingleOptionRenderer: (vals) => (
      <Badge variant="light" radius="sm">
        {vals[0]?.label}
      </Badge>
    ),
    filterMultipleOptionRenderer: (vals) => (
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
    ),
  } satisfies FilterObjectConfig<Skill>,
  {
    name: "role",
    label: "Role",
    type: "text",
    icon: <WrenchIcon size={14} />,
    filterSearch: (term) => searchSuggestions("role", term),
  },
  {
    name: "salary",
    label: "Salary",
    type: "number",
    icon: <DollarSignIcon size={14} />,
    minNumber: 0,
  },
  {
    name: "hireDate",
    label: "Hire date",
    type: "date",
    icon: <CalendarDaysIcon size={14} />,
    formatDate: (date) => format(date, "PP"),
    customOptions: dateShortcuts(),
  },
  {
    name: "lastLogin",
    label: "Last login",
    type: "dateTime",
    icon: <ClockIcon size={14} />,
    formatDate: (date) => format(date, "PP p"),
    customOptions: dateTimeShortcuts(),
  },
  {
    name: "isActive",
    label: "Active",
    type: "boolean",
    icon: <BadgeCheckIcon size={14} />,
    context: { trueValueLabel: "Active", falseValueLabel: "Inactive" },
  },
];
