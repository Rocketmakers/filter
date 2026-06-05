import { Filter } from "@/components/ui/filter";
import { FilterCommand } from "./command";

export const FilterBuilderAdd = ({
  disabled,
  hasFilters,
}: {
  disabled?: boolean;
  hasFilters?: boolean;
}) => {
  if (disabled) {
    return <Filter.AddButton disabled hasFilters={hasFilters} />;
  }
  return (
    <FilterCommand>
      <Filter.AddButton hasFilters={hasFilters} />
    </FilterCommand>
  );
};
