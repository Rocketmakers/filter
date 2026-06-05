import { createContext } from "@radix-ui/react-context";
import type {
  FilterBaseOption,
  FilterBuilderValue,
  FilterCondition,
  FilterConfig,
  FilterOptionRegistry,
} from "./types";

export type FilterBuilderContextValue = {
  value: FilterBuilderValue[];
  filters: FilterOptionRegistry;
  addFilter: (
    id: string,
    filter: FilterConfig,
    newValue: FilterBaseOption[],
  ) => void;
  removeFilter: (id: string) => void;
  updateFilter: (id: string, newValue: FilterBaseOption[]) => void;
  doesFilterExist: (id: string) => boolean;
  updateFilterValueCondition: (id: string, condition: FilterCondition) => void;
};

export const [FilterBuilderContextProvider, useFilterBuilder] =
  createContext<FilterBuilderContextValue>("FilterBuilder", {
    value: [],
    filters: [],
    addFilter: () => undefined,
    removeFilter: () => undefined,
    updateFilter: () => undefined,
    doesFilterExist: () => false,
    updateFilterValueCondition: () => undefined,
  });
