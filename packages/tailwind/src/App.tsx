import { format } from "date-fns";
import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  FilterBuilder,
  useFilteredRows,
  type FilterBuilderValue,
} from "@/components/ui/filter-builder";

import { EMPLOYEES } from "./demo/employees";
import { employeeFilters } from "./demo/registry";

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

export default function App() {
  const [filters, setFilters] = useState<FilterBuilderValue[]>([]);
  const filteredEmployees = useFilteredRows(EMPLOYEES, filters);
  const [dark, toggleDark] = useDarkMode();

  return (
    <TooltipProvider delayDuration={200}>
      <Toaster position="top-right" theme={dark ? "dark" : "light"} />
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  filter-builder
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  A shadcn-style generic filter builder. All 6 data types
                  demonstrated on {EMPLOYEES.length} mock employees.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {filteredEmployees.length} / {EMPLOYEES.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleDark}
                  aria-label="Toggle theme"
                >
                  {dark ? <SunIcon /> : <MoonIcon />}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
          <section>
            <FilterBuilder
              id="employee-filter-builder"
              filters={employeeFilters}
              value={filters}
              onChange={setFilters}
            />
          </section>

          <section className="rounded-md border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Department</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Skills</th>
                  <th className="px-4 py-2 font-medium text-right">Salary</th>
                  <th className="px-4 py-2 font-medium">Hired</th>
                  <th className="px-4 py-2 font-medium">Last login</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No employees match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {emp.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">{emp.department.name}</td>
                      <td className="px-4 py-3">{emp.role}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {emp.skills.map((skill) => (
                            <span
                              key={skill.id}
                              className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        ${emp.salary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {format(emp.hireDate, "PP")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(emp.lastLogin, "PP p")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            emp.isActive
                              ? "inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                              : "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                          }
                        >
                          {emp.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}
