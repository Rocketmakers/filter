import { Filter } from "@/components/ui/filter";

import { FilterCommand } from "./command";

/**
 * The "+ Filter" trigger sits at the end of the pill row. Corner rounding is
 * computed from `hasFilters`:
 *   - no pills  → only child (first AND last)  → fully rounded
 *   - has pills → last child only             → right side rounded
 */
export const FilterBuilderAdd = ({
  disabled,
  hasFilters,
}: {
  disabled?: boolean;
  hasFilters?: boolean;
}) => {
  const position = { isFirst: !hasFilters, isLast: true };
  if (disabled) {
    return <Filter.AddButton disabled {...position} />;
  }
  return (
    <FilterCommand>
      <Filter.AddButton {...position} />
    </FilterCommand>
  );
};
