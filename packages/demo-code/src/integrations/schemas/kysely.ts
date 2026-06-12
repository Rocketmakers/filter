export interface EmployeeTable {
  id: string;
  name: string;
  email: string;
  role: string;
  salary: number;
  hire_date: string; // ISO string
  last_login: string;
  is_active: 0 | 1;
  department_id: string;
  /** JSON-encoded `string[]`. */
  aliases: string | null;
  /** JSON-encoded `number[]`. */
  quarterly_scores: string | null;
  /** JSON-encoded `string[]` (ISO dates). */
  performance_review_dates: string | null;
  /** JSON-encoded `string[]` (ISO date-times). */
  shift_starts: string | null;
}

export interface DepartmentTable {
  id: string;
  name: string;
}

export interface SkillTable {
  id: string;
  name: string;
}

export interface EmployeeSkillTable {
  employee_id: string;
  skill_id: string;
}

export interface DB {
  employees: EmployeeTable;
  departments: DepartmentTable;
  skills: SkillTable;
  employee_skills: EmployeeSkillTable;
}
