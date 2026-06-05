import { Popover } from "@mantine/core";
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

import { useFilterBuilder } from "./context";
import type { FilterConfig } from "./types";
import { getFilterConfigComponent } from "./utils";

import styles from "./command.module.scss";

/** Same role as the Tailwind variant — exposes the cmdk input's height to its
 *  popover ancestor so the list can size correctly under it. */
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
  deps: React.DependencyList = [],
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
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterConfig | undefined>(
    undefined,
  );
  const [inputValue, setInputValue] = useState("");
  const [commandValue, setCommandValue] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentID = useMemo(() => uniqueId("filter-"), [popoverOpen]);

  useEffect(() => {
    if (popoverOpen) {
      // Mantine renders the dropdown via a Transition wrapper, so the cmdk
      // input ref isn't attached on the same tick as `opened` flipping true.
      // Defer focus to the next frame so the ref is live.
      const raf = requestAnimationFrame(() => {
        comboInputRef.current?.focus();
      });
      setSelectedFilter(undefined);
      setInputValue("");
      return () => cancelAnimationFrame(raf);
    }
    setSelectedFilter(undefined);
    setInputValue("");
    return undefined;
  }, [popoverOpen]);

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
    (commandValueIn: string | undefined) => {
      if (!commandValueIn) {
        setSelectedFilter(undefined);
        return;
      }
      const filter = filters.find(
        (f) => f.name.toLowerCase() === commandValueIn.toLowerCase(),
      );
      if (!filter) return;
      setInputValue("");
      setSelectedFilter(filter);
      comboInputRef.current?.focus();
    },
    [filters],
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
    <Popover
      opened={popoverOpen}
      onChange={setPopoverOpen}
      withinPortal
      position="bottom-start"
      shadow="md"
      offset={4}
      trapFocus={false}
      transitionProps={{ duration: 0 }}
    >
      <Popover.Target>
        <span
          onClick={() => setPopoverOpen((open) => !open)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setPopoverOpen((open) => !open);
            }
          }}
        >
          {children}
        </span>
      </Popover.Target>
      <Popover.Dropdown className={styles.popover}>
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
      </Popover.Dropdown>
    </Popover>
  );
};
