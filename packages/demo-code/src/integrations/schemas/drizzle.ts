import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Schema used by the Drizzle integration example. SQLite-flavoured but
 * the column names line up with the Kysely DB interface and Mongoose
 * model so the examples can stay in sync.
 *
 * Array-typed columns (`aliases`, `quarterlyScores`,
 * `performanceReviewDates`, `shiftStarts`) are stored as JSON. SQLite and
 * Postgres both expose `json_each` for "any element matches X" style
 * predicates — the plural variants in the example use that.
 */
export const employees = sqliteTable("employees", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  salary: integer("salary").notNull(),
  hireDate: integer("hire_date", { mode: "timestamp" }).notNull(),
  lastLogin: integer("last_login", { mode: "timestamp" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull(),
  departmentId: text("department_id").notNull(),
  aliases: text("aliases", { mode: "json" }).$type<string[]>(),
  quarterlyScores: text("quarterly_scores", { mode: "json" }).$type<number[]>(),
  performanceReviewDates: text("performance_review_dates", {
    mode: "json",
  }).$type<string[]>(),
  shiftStarts: text("shift_starts", { mode: "json" }).$type<string[]>(),
});

export const departments = sqliteTable("departments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const skills = sqliteTable("skills", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

/** Junction table for the many-to-many between employees and skills. */
export const employeeSkills = sqliteTable("employee_skills", {
  employeeId: text("employee_id").notNull(),
  skillId: text("skill_id").notNull(),
});
