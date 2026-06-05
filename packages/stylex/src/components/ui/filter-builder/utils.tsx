import { FilterBooleanRenderer } from "./renderers/boolean";
import { FilterDateRenderer } from "./renderers/date";
import { FilterDateTimeRenderer } from "./renderers/date-time";
import { FilterNumberRenderer } from "./renderers/number";
import { FilterSelectRenderer } from "./renderers/select";
import { FilterTextRenderer } from "./renderers/text";
import {
  filterConditions,
  type FilterBaseOption,
  type FilterBuilderValue,
  type FilterCondition,
  type FilterConfig,
  type FilterConfigItemsRenderProps,
  type FilterDataType,
} from "./types";

export const getFilterConfigComponent = (
  filterConfig: FilterConfig,
  props: FilterConfigItemsRenderProps<FilterConfig>,
) => {
  switch (filterConfig.type) {
    case "text":
      return <FilterTextRenderer {...props} filter={filterConfig} />;
    case "select":
      return <FilterSelectRenderer {...props} filter={filterConfig} />;
    case "date":
      return <FilterDateRenderer {...props} filter={filterConfig} />;
    case "dateTime":
      return <FilterDateTimeRenderer {...props} filter={filterConfig} />;
    case "boolean":
      return <FilterBooleanRenderer {...props} filter={filterConfig} />;
    case "number":
      return <FilterNumberRenderer {...props} filter={filterConfig} />;
    default:
      return null;
  }
};

export const getValidConditions = (
  dataType: FilterDataType,
  multiple: boolean | "bothMultipleAndSingle",
  multipleValues?: boolean,
  positive?: boolean,
): FilterCondition[] => {
  return filterConditions.filter((condition) => {
    if (condition.dataType !== dataType) return false;

    const multipleOk =
      condition.multiple === multiple ||
      condition.multiple === "bothMultipleAndSingle" ||
      multiple === "bothMultipleAndSingle";
    if (!multipleOk) return false;

    const multipleValuesOk =
      multipleValues !== undefined
        ? condition.multipleValues === multipleValues
        : condition.multipleValues === undefined ||
          condition.multipleValues === false;
    if (!multipleValuesOk) return false;

    if (positive !== undefined && condition.positive !== positive) return false;

    return true;
  });
};

export const updateFilterCondition = (
  filters: FilterBuilderValue[],
  currentId: string,
  condition: FilterCondition,
): FilterBuilderValue[] =>
  filters.map((filter) =>
    filter.id === currentId ? { ...filter, condition } : filter,
  );

export const updateFilterValue = (
  filters: FilterBuilderValue[],
  currentId: string,
  value: FilterBaseOption[],
): FilterBuilderValue[] => {
  const prev = filters.find((f) => f.id === currentId);
  if (!prev) return filters;

  const prevMultiple = prev.value.length > 1;
  const nextMultiple = value.length > 1;

  const nextCondition =
    prevMultiple !== nextMultiple
      ? (getValidConditions(
          prev.condition.dataType,
          nextMultiple,
          prev.condition.multipleValues,
          prev.condition.positive,
        )[0] ?? prev.condition)
      : prev.condition;

  return filters.map((filter) =>
    filter.id === currentId
      ? { ...filter, value, condition: nextCondition }
      : filter,
  );
};
