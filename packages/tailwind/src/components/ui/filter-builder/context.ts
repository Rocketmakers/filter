import { createContext } from "@radix-ui/react-context";
import type {
  FilterBaseOption,
  FilterBuilderValue,
  FilterCondition,
  FilterConfig,
  FilterOptionRegistry,
} from "./types";

export type FilterBuilderContextValue = {
  /** Current controlled value — all active filter pills. */
  value: FilterBuilderValue[];
  /** Registry of filter configs available to add. */
  filters: FilterOptionRegistry;
  /** Append a new filter pill. */
  addFilter: (
    id: string,
    filter: FilterConfig,
    newValue: FilterBaseOption[]
  ) => void;
  /** Remove an existing filter pill by its instance id. */
  removeFilter: (id: string) => void;
  /** Replace the value array of an existing pill. */
  updateFilter: (id: string, newValue: FilterBaseOption[]) => void;
  /** Check whether a pill with the given id is in state. */
  doesFilterExist: (id: string) => boolean;
  /** Change the condition (e.g. "is" → "is not") for an existing pill. */
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
