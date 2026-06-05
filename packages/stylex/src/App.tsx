import { format } from "date-fns";
import { MoonIcon, SunIcon } from "lucide-react";
import { useState } from "react";
import { Toaster } from "sonner";
import * as stylex from "@stylexjs/stylex";

import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  FilterBuilder,
  useFilteredRows,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";
import { radii, spacing, text } from "@/constants.stylex";
import { colors } from "@/tokens.stylex";
import { useTheme } from "@/lib/theme";

import { EMPLOYEES } from "./demo/employees";
import { employeeFilters } from "./demo/registry";

const styles = stylex.create({
  app: {
    minHeight: "100vh",
    backgroundColor: colors.background,
    color: colors.foreground,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  headerInner: {
    maxWidth: "72rem",
    marginInline: "auto",
    paddingInline: spacing.xl,
    paddingBlock: spacing["2xl"],
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 600,
    letterSpacing: "-0.025em",
    margin: 0,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: text.sm,
    color: colors.mutedForeground,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
  },
  count: {
    fontSize: text.xs,
    color: colors.mutedForeground,
  },
  main: {
    maxWidth: "72rem",
    marginInline: "auto",
    paddingInline: spacing.xl,
    paddingBlock: spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
  },
  table: {
    width: "100%",
    fontSize: text.sm,
    borderCollapse: "collapse",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  thead: {
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
    fontSize: text.xs,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    textAlign: "left",
  },
  th: {
    paddingInline: spacing.lg,
    paddingBlock: "0.5rem",
    fontWeight: 500,
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  td: {
    paddingInline: spacing.lg,
    paddingBlock: spacing.md,
  },
  tdRight: {
    paddingInline: spacing.lg,
    paddingBlock: spacing.md,
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
  muted: {
    color: colors.mutedForeground,
  },
  skillsRow: {
    display: "flex",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  skillBadge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: radii.md,
    backgroundColor: colors.muted,
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontSize: text.xs,
  },
  statusActive: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: radii.full,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    color: "#047857",
    paddingInline: spacing.sm,
    paddingBlock: "0.125rem",
    fontSize: text.xs,
    fontWeight: 500,
  },
  statusInactive: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: radii.full,
    backgroundColor: colors.muted,
    color: colors.mutedForeground,
    paddingInline: spacing.sm,
    paddingBlock: "0.125rem",
    fontSize: text.xs,
    fontWeight: 500,
  },
  emptyRow: {
    paddingInline: spacing.lg,
    paddingBlock: "3rem",
    textAlign: "center",
    color: colors.mutedForeground,
  },
});

export default function App() {
  const [filters, setFilters] = useState<FilterBuilderValue[]>([]);
  const filteredEmployees = useFilteredRows(EMPLOYEES, filters);
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <TooltipProvider delayDuration={200}>
      <Toaster position="top-right" theme={isDark ? "dark" : "light"} />
      <div {...stylex.props(styles.app)}>
        <header {...stylex.props(styles.header)}>
          <div {...stylex.props(styles.headerInner)}>
            <div>
              <h1 {...stylex.props(styles.title)}>filter-builder · StyleX</h1>
              <p {...stylex.props(styles.subtitle)}>
                StyleX + Radix + cmdk · all 6 data types over{" "}
                {EMPLOYEES.length} mock employees.
              </p>
            </div>
            <div {...stylex.props(styles.toolbar)}>
              <span {...stylex.props(styles.count)}>
                {filteredEmployees.length} / {EMPLOYEES.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={toggle}
                aria-label="Toggle theme"
              >
                {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              </Button>
            </div>
          </div>
        </header>

        <main {...stylex.props(styles.main)}>
          <FilterBuilder
            id="employee-filter-builder"
            filters={employeeFilters}
            value={filters}
            onChange={setFilters}
          />

          <table {...stylex.props(styles.table)}>
            <thead {...stylex.props(styles.thead)}>
              <tr>
                <th {...stylex.props(styles.th)}>Name</th>
                <th {...stylex.props(styles.th)}>Department</th>
                <th {...stylex.props(styles.th)}>Role</th>
                <th {...stylex.props(styles.th)}>Skills</th>
                <th {...stylex.props(styles.th)} style={{ textAlign: "right" }}>
                  Salary
                </th>
                <th {...stylex.props(styles.th)}>Hired</th>
                <th {...stylex.props(styles.th)}>Last login</th>
                <th {...stylex.props(styles.th)}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} {...stylex.props(styles.emptyRow)}>
                    No employees match the current filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} {...stylex.props(styles.tr)}>
                    <td {...stylex.props(styles.td)}>
                      <div style={{ fontWeight: 500 }}>{emp.name}</div>
                      <div {...stylex.props(styles.muted, styles.count)}>
                        {emp.email}
                      </div>
                    </td>
                    <td {...stylex.props(styles.td)}>{emp.department.name}</td>
                    <td {...stylex.props(styles.td)}>{emp.role}</td>
                    <td {...stylex.props(styles.td)}>
                      <div {...stylex.props(styles.skillsRow)}>
                        {emp.skills.map((skill) => (
                          <span
                            key={skill.id}
                            {...stylex.props(styles.skillBadge)}
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td {...stylex.props(styles.tdRight)}>
                      ${emp.salary.toLocaleString()}
                    </td>
                    <td {...stylex.props(styles.td)}>
                      {format(emp.hireDate, "PP")}
                    </td>
                    <td {...stylex.props(styles.td, styles.muted)}>
                      {format(emp.lastLogin, "PP p")}
                    </td>
                    <td {...stylex.props(styles.td)}>
                      <span
                        {...stylex.props(
                          emp.isActive
                            ? styles.statusActive
                            : styles.statusInactive,
                        )}
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </main>
      </div>
    </TooltipProvider>
  );
}
