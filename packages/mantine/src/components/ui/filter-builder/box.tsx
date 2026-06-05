import { Menu, Popover } from "@mantine/core";
import { CheckIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Filter } from "@/components/ui/filter";

import { useSetCmdkInputHeight } from "./command";
import { useFilterBuilder } from "./context";
import type { FilterBuilderValue, FilterCondition } from "./types";
import { getFilterConfigComponent, getValidConditions } from "./utils";

import styles from "./box.module.scss";
import popoverStyles from "./command.module.scss";

export const FilterBuilderBox = ({
  value,
}: {
  value: FilterBuilderValue;
}) => {
  const { filters, removeFilter, updateFilterValueCondition } =
    useFilterBuilder("FilterBuilderBox");

  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useSetCmdkInputHeight(
    { inputRef, parentRef: popoverRef, isRendered: popoverOpen },
    [popoverOpen],
  );

  const filterConfig = useMemo(
    () => filters.find((f) => f.name === value.property),
    [filters, value.property],
  );

  const filterConditionsOptions: FilterCondition[] = useMemo(() => {
    if (!filterConfig) return [];
    return getValidConditions(
      value.condition.dataType,
      value.value.length > 1,
      value.condition.multipleValues,
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
        return filterConfig.filterMultipleOptionRenderer(value.value);
      }
      return filterConfig.filterSingleOptionRenderer(value.value);
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

      <Menu
        withinPortal
        shadow="md"
        position="bottom-start"
        offset={4}
        disabled={conditionIsLocked}
      >
        <Menu.Target>
          <Filter.Condition disabled={conditionIsLocked}>
            {value.condition.label}
          </Filter.Condition>
        </Menu.Target>
        {!conditionIsLocked && (
          <Menu.Dropdown className={styles.menuDropdown}>
            {filterConditionsOptions.map((condition) => (
              <Menu.Item
                key={condition.type}
                onClick={() => updateFilterValueCondition(value.id, condition)}
                leftSection={condition.icon}
                rightSection={
                  value.condition.type === condition.type ? (
                    <CheckIcon size={12} />
                  ) : undefined
                }
              >
                {condition.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        )}
      </Menu>

      <Popover
        opened={popoverOpen}
        onChange={setPopoverOpen}
        withinPortal
        position="bottom-start"
        shadow="md"
        offset={4}
        trapFocus={false}
      >
        <Popover.Target>
          <Filter.Predicate
            aria-label={`Edit ${filterConfig.label} value`}
            onClick={() => setPopoverOpen((open) => !open)}
          >
            {renderPredicate}
          </Filter.Predicate>
        </Popover.Target>
        <Popover.Dropdown
          className={popoverStyles.popover}
          ref={popoverRef}
        >
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
        </Popover.Dropdown>
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
