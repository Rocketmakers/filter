import { CheckIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "@/components/ui/filter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useSetCmdkInputHeight } from "./command";
import { useFilterBuilder } from "./context";
import type { FilterBuilderValue, FilterCondition } from "./types";
import { getFilterConfigComponent, getValidConditions } from "./utils";

export const FilterBuilderBox = <T,>({
  value,
}: {
  value: FilterBuilderValue<T>;
}) => {
  const { filters, removeFilter, updateFilterValueCondition } =
    useFilterBuilder("FilterBuilderBox");

  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useSetCmdkInputHeight(
    { inputRef, parentRef: popoverRef, isRendered: popoverOpen },
    [popoverOpen]
  );

  const filterConfig = useMemo(
    () => filters.find((f) => f.name === value.property),
    [filters, value.property]
  );

  const filterConditionsOptions: FilterCondition[] = useMemo(() => {
    if (!filterConfig) return [];
    return getValidConditions(
      value.condition.dataType,
      value.value.length > 1,
      value.condition.multipleValues
    );
  }, [filterConfig, value]);

  const FilterItemsComponent = useMemo(() => {
    if (!filterConfig) return null;
    return getFilterConfigComponent(filterConfig, {
      currentID: value.id,
      filter: filterConfig,
      inputValue,
    });
  }, [filterConfig, value.id, inputValue]);

  const renderPredicate = useMemo(() => {
    if (!filterConfig) return null;
    if (filterConfig.type === "select") {
      if (filterConfig.multiple && value.value.length > 1) {
        return filterConfig.filterMultipleOptionRenderer(
          value.value as never
        );
      }
      return filterConfig.filterSingleOptionRenderer(value.value as never);
    }
    return value.value.map((v) => v.label).join(", ");
  }, [value, filterConfig]);

  useEffect(() => {
    setInputValue("");
  }, [popoverOpen]);

  if (!filterConfig) return null;

  const conditionIsLocked = !!value.lockedCondition;

  return (
    <Filter.Box id={value.property}>
      <Filter.Property>
        {filterConfig.icon}
        {filterConfig.label}
      </Filter.Property>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={conditionIsLocked}>
          <Filter.Condition>{value.condition.label}</Filter.Condition>
        </DropdownMenuTrigger>
        {!conditionIsLocked && (
          <DropdownMenuContent>
            {filterConditionsOptions.map((condition) => (
              <DropdownMenuItem
                key={condition.type}
                onSelect={() => updateFilterValueCondition(value.id, condition)}
              >
                {condition.icon}
                <span className="flex-1">{condition.label}</span>
                {value.condition.type === condition.type && (
                  <CheckIcon className="size-3" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal>
        <PopoverTrigger asChild>
          <Filter.Predicate
            aria-label={`Edit ${filterConfig.label} value`}
          >
            {renderPredicate}
          </Filter.Predicate>
        </PopoverTrigger>
        <PopoverContent ref={popoverRef} className="p-0">
          <Command>
            <CommandInput
              placeholder={filterConfig.inputPlaceholder ?? "Filter..."}
              value={inputValue}
              ref={inputRef}
              onValueChange={setInputValue}
            />
            <CommandList>
              {FilterItemsComponent ?? (
                <CommandEmpty>No options found</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Filter.CloseLock
        type={value.locked ? "lock" : "remove"}
        onClick={() => {
          if (!value.locked) removeFilter(value.id);
        }}
      />
    </Filter.Box>
  );
};
