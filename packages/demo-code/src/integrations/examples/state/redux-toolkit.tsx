import {
  configureStore,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import * as React from "react";
import { Provider, useDispatch, useSelector } from "react-redux";

import {
  FilterBuilder,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import type { FilterFieldConfig } from "../../shared.ts";

const filterSlice = createSlice({
  name: "filters",
  initialState: { value: [] as FilterBuilderValue[] },
  reducers: {
    setFilters(state, action: PayloadAction<FilterBuilderValue[]>) {
      state.value = action.payload;
    },
    clearFilters(state) {
      state.value = [];
    },
  },
});

export const { setFilters, clearFilters } = filterSlice.actions;

export const store = configureStore({
  reducer: { filters: filterSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

export function EmployeeTable({
  registry,
}: {
  registry: FilterFieldConfig[];
}): React.ReactNode {
  const filters = useSelector((s: RootState) => s.filters.value);
  const dispatch = useDispatch<AppDispatch>();
  return (
    <FilterBuilder
      filters={registry}
      value={filters}
      onChange={(next) => dispatch(setFilters(next))}
    />
  );
}
