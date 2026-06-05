import { uniqueId } from "lodash";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useFilterBuilder } from "./context";
import type { FilterConfig } from "./types";
import { getFilterConfigComponent } from "./utils";

/**
 * Measures the cmdk input's height and exposes it as `--cmdk-input-height`
 * on the popover so list content can size around it.
 */
export const useSetCmdkInputHeight = (
  {
    inputRef,
    parentRef,
    isRendered = true,
  }: {
    inputRef: React.RefObject<HTMLInputElement | null>;
    parentRef?: React.RefObject<HTMLElement | null>;
    isRendered?: boolean;
  },
  deps: React.DependencyList = []
) => {
  useLayoutEffect(() => {
    if (!isRendered) return;
    const measureHeight = () => {
      if (inputRef.current) {
        const height = inputRef.current.offsetHeight;
        const target = parentRef?.current ?? inputRef.current;
        target.style.setProperty("--cmdk-input-height", `${height}px`);
      }
    };
    requestAnimationFrame(measureHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef, parentRef, isRendered, ...deps]);
};

export const FilterCommand = ({ children }: { children: React.ReactNode }) => {
  const { filters, value } = useFilterBuilder("FilterCommand");
  const comboInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterConfig | undefined>(
    undefined
  );
  const [inputValue, setInputValue] = useState("");
  const [commandValue, setCommandValue] = useState("");

  // Fresh id each time the popover opens so additions are uniquely keyed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentID = useMemo(() => uniqueId("filter-"), [popoverOpen]);

  useEffect(() => {
    if (popoverOpen) comboInputRef.current?.focus();
    setSelectedFilter(undefined);
    setInputValue("");
  }, [popoverOpen]);

  useSetCmdkInputHeight(
    { inputRef: comboInputRef, parentRef: popoverRef, isRendered: popoverOpen },
    [popoverOpen]
  );

  const inputPlaceholder = useMemo(() => {
    if (!selectedFilter) return "Filter...";
    switch (selectedFilter.type) {
      case "select":
        return `Select ${selectedFilter.label.toLowerCase()}...`;
      case "text":
        return `Enter ${selectedFilter.label.toLowerCase()}...`;
      case "number":
        return "Enter number...";
      case "boolean":
        return "Select option...";
      case "date":
        return "Pick a shortcut, or type e.g. 01/01/2025 or 'next week'...";
      case "dateTime":
        return "Pick a shortcut, or type e.g. 'tomorrow 9am'...";
      default:
        return "Filter...";
    }
  }, [selectedFilter]);

  const updateSelectedFilter = useCallback(
    (commandValue: string | undefined) => {
      if (!commandValue) {
        setSelectedFilter(undefined);
        return;
      }
      const filter = filters.find(
        (f) => f.name.toLowerCase() === commandValue.toLowerCase()
      );
      if (!filter) return;
      setInputValue("");
      setSelectedFilter(filter);
    },
    [filters]
  );

  const configRender = useMemo(() => {
    if (!selectedFilter) return null;
    return (
      getFilterConfigComponent(selectedFilter, {
        currentID,
        filter: selectedFilter,
        inputValue,
      }) ?? null
    );
  }, [selectedFilter, inputValue, currentID]);

  // Close the popover after a value is committed — but keep it open for the
  // types where multi-step picking is the norm (select, date, dateTime).
  useEffect(() => {
    if (
      selectedFilter &&
      selectedFilter.type !== "select" &&
      selectedFilter.type !== "date" &&
      selectedFilter.type !== "dateTime"
    ) {
      setPopoverOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent ref={popoverRef} className="p-0">
        <Command loop value={commandValue} onValueChange={setCommandValue}>
          <CommandInput
            ref={comboInputRef}
            placeholder={inputPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {selectedFilter ? (
              configRender
            ) : (
              <>
                <CommandEmpty>
                  No filters found for "{commandValue}"
                </CommandEmpty>
                <CommandGroup>
                  {filters
                    .filter((f) => f.hidden !== true)
                    .map((filter) => (
                      <CommandItem
                        key={filter.name}
                        value={filter.name}
                        onSelect={updateSelectedFilter}
                      >
                        {filter.icon}
                        {filter.label}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
