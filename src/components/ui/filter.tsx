import * as React from "react";
import { LockIcon, XIcon, ListFilterPlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FilterAddButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Whether the filter row has existing filter pills to the left. Controls the rounded-left edge. */
  hasFilters?: boolean;
};

const FilterAddButton = React.forwardRef<HTMLButtonElement, FilterAddButtonProps>(
  ({ hasFilters, className, ...props }, ref) => (
    <Button
      ref={ref}
      aria-label="Add filter"
      variant="ghost"
      className={cn(
        "flex items-center gap-1.5 [&>svg]:w-3 [&>svg]:h-3 border border-input",
        hasFilters && "rounded-l-none",
        className
      )}
      {...props}
    >
      <Label>Filter</Label>
      <ListFilterPlus className="mt-[1px] stroke-foreground" />
    </Button>
  )
);
FilterAddButton.displayName = "FilterAddButton";

const FilterContainer = ({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    id={id}
    className={cn(
      "flex flex-row flex-wrap items-center",
      "[&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md",
      "[&>*:last-child:not(:only-child)]:border-l-0 [&>*:first-child]:border-l",
      "[&>*]:border-t [&>*]:border-r [&>*]:border-b [&>*]:border-input [&>*]:bg-background",
      className
    )}
  >
    {children}
  </div>
);

const FilterBox = ({
  children,
}: {
  children: React.ReactNode;
  id?: string;
}) => (
  <div
    className={cn(
      "flex flex-row items-center h-10 border border-input bg-background text-sm transition-colors",
      "focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
      "[&>svg]:w-3 [&>svg]:h-3 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
    )}
  >
    {children}
  </div>
);

const sharedFilterButton = cn(
  "outline-none border-none bg-transparent font-sans text-xs font-normal text-foreground whitespace-nowrap overflow-hidden text-ellipsis w-auto h-full flex flex-row items-center gap-1.5 px-2 transition-colors",
  "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground active:bg-accent active:text-accent-foreground",
  "[&>svg]:w-3 [&>svg]:h-3 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
);

const FilterProperty = React.forwardRef<
  HTMLButtonElement,
  { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, ...props }, ref) => (
  <button ref={ref} {...props} className={cn(sharedFilterButton, className)}>
    {children}
  </button>
));
FilterProperty.displayName = "FilterProperty";

const FilterCondition = React.forwardRef<
  HTMLButtonElement,
  { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, ...props }, ref) => (
  <button
    ref={ref}
    {...props}
    className={cn(sharedFilterButton, "h-6 bg-muted rounded-sm mx-1", className)}
  >
    {children}
  </button>
));
FilterCondition.displayName = "FilterCondition";

const FilterPredicate = React.forwardRef<
  HTMLButtonElement,
  { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, ...props }, ref) => (
  <button ref={ref} {...props} className={cn(sharedFilterButton, className)}>
    {children}
  </button>
));
FilterPredicate.displayName = "FilterPredicate";

const FilterCloseLock = ({
  type,
  onClick,
}: {
  type: "lock" | "remove";
  onClick?: () => void;
}) => (
  <div className="flex flex-1 h-7 mr-1 justify-center items-center">
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => type === "remove" && onClick?.()}
          className={cn(sharedFilterButton, "rounded-full h-full px-1.5")}
          aria-label={type === "remove" ? "Remove filter" : "Locked filter"}
        >
          {type === "lock" && <LockIcon />}
          {type === "remove" && <XIcon />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {type === "lock" ? "This filter is locked" : "Remove filter"}
      </TooltipContent>
    </Tooltip>
  </div>
);

const Filter = Object.assign(FilterContainer, {
  AddButton: FilterAddButton,
  Box: FilterBox,
  Property: FilterProperty,
  Condition: FilterCondition,
  Predicate: FilterPredicate,
  CloseLock: FilterCloseLock,
});

export { Filter };
