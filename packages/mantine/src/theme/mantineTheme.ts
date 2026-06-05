import { createTheme } from "@mantine/core";

export const mantineTheme = createTheme({
  primaryColor: "dark",
  defaultRadius: "md",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
  },
  components: {
    Button: {
      defaultProps: { size: "sm" },
    },
    Popover: {
      defaultProps: { withinPortal: true, shadow: "md" },
    },
    Menu: {
      defaultProps: { withinPortal: true, shadow: "md" },
    },
    Tooltip: {
      defaultProps: { withinPortal: true, openDelay: 200 },
    },
  },
});
