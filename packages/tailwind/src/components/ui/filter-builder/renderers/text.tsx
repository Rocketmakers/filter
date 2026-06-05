import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";

import { useFilterBuilder } from "../context";
import type {
  FilterBaseOption,
  FilterConfigItemsRenderProps,
  FilterTextConfig,
} from "../types";

const MAX_SUGGESTIONS = 10;

export const FilterTextRenderer = ({
  filter,
  inputValue,
  currentID,
}: FilterConfigItemsRenderProps<FilterTextConfig>) => {
  const { addFilter, updateFilter, doesFilterExist } =
    useFilterBuilder("FilterTextRenderer");

  const [suggestions, setSuggestions] = useState<FilterBaseOption<string>[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const onSelect = useCallback(
    (option: FilterBaseOption<string>) => {
      if (doesFilterExist(currentID)) {
        updateFilter(currentID, [option]);
        return;
      }
      addFilter(currentID, filter, [option]);
    },
    [addFilter, updateFilter, doesFilterExist, currentID, filter]
  );

  const fetchSuggestions = useMemo(() => {
    if (!filter.filterSearch) return null;
    const search = filter.filterSearch;
    return debounce(async (term: string, requestId: number) => {
      try {
        const results = await search(term);
        // Drop stale responses if a newer request has been kicked off.
        if (requestId !== latestRequestRef.current) return;
        setSuggestions(results.slice(0, MAX_SUGGESTIONS));
      } finally {
        if (requestId === latestRequestRef.current) setLoading(false);
      }
    }, 250);
  }, [filter.filterSearch]);

  // Ref-equivalent via closure: track the latest request so stale responses
  // (slow network + fast typing) don't clobber fresh results.
  const latestRequestRef = useMemo(() => ({ current: 0 }), []);

  const trimmedInput = inputValue.trim();

  useEffect(() => {
    if (!fetchSuggestions) return;
    latestRequestRef.current += 1;
    const requestId = latestRequestRef.current;
    if (trimmedInput.length === 0) {
      // No query → don't hit the backend. Clear any prior results so the
      // popover doesn't show stale suggestions from an earlier search.
      fetchSuggestions.cancel();
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSuggestions(trimmedInput, requestId);
    return () => {
      fetchSuggestions.cancel();
    };
  }, [trimmedInput, fetchSuggestions, latestRequestRef]);

  const customOptionMatchesInput = useMemo(
    () =>
      !!filter.customOptions?.some(
        (option) => option.label.toLowerCase() === trimmedInput.toLowerCase()
      ),
    [filter.customOptions, trimmedInput]
  );

  const suggestionMatchesInput = useMemo(
    () =>
      suggestions.some(
        (option) => option.label.toLowerCase() === trimmedInput.toLowerCase()
      ),
    [suggestions, trimmedInput]
  );

  const showFreeTextItem =
    trimmedInput.length > 0 &&
    !customOptionMatchesInput &&
    !suggestionMatchesInput;

  const showEmptyState =
    !!filter.filterSearch &&
    trimmedInput.length > 0 &&
    !loading &&
    suggestions.length === 0 &&
    !showFreeTextItem &&
    (!filter.customOptions || filter.customOptions.length === 0);

  return (
    <>
      {showFreeTextItem && (
        <CommandGroup>
          <CommandItem
            key="text-value"
            value={trimmedInput}
            onSelect={() =>
              onSelect({
                id: "text-value",
                label: trimmedInput,
                value: trimmedInput,
              })
            }
          >
            <Label>Text value:</Label>
            {trimmedInput}
          </CommandItem>
        </CommandGroup>
      )}

      {filter.filterSearch && trimmedInput.length > 0 && (
        <>
          {showFreeTextItem && <CommandSeparator />}
          <CommandGroup heading="Suggestions">
            {loading && (
              <CommandItem
                disabled
                value="__loading__"
                className="opacity-60"
              >
                Searching…
              </CommandItem>
            )}
            {!loading &&
              suggestions.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.label}__${option.id}`}
                  onSelect={() => onSelect(option)}
                >
                  {option.label}
                </CommandItem>
              ))}
          </CommandGroup>
        </>
      )}

      {showEmptyState && (
        <CommandEmpty>No matches for "{trimmedInput}"</CommandEmpty>
      )}

      {filter.customOptions && filter.customOptions.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup>
            {filter.customOptions.map((option) => (
              <CommandItem
                key={option.id}
                value={option.label}
                onSelect={() =>
                  onSelect({
                    id: option.id,
                    label: option.label,
                    value: String(option.value ?? option.label),
                  })
                }
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}
    </>
  );
};
