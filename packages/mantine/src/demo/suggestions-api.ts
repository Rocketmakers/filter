import type { FilterBaseOption } from "@/components/ui/filter-builder";

import {
  DEPARTMENTS,
  EMPLOYEES,
  SKILLS,
  type Department,
  type Employee,
  type Skill,
} from "./employees";

const FIELDS = ["name", "email", "role"] as const;
type Field = (typeof FIELDS)[number];

const FAUX_LATENCY_MS = { min: 120, max: 380 };
const SERVER_RESULT_CAP = 10;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const randomLatency = () =>
  FAUX_LATENCY_MS.min +
  Math.random() * (FAUX_LATENCY_MS.max - FAUX_LATENCY_MS.min);

function score(candidate: string, query: string): number {
  if (!query) return 0;
  const c = candidate.toLowerCase();
  const q = query.toLowerCase();
  if (c === q) return 1000;
  if (c.startsWith(q)) return 500 - c.length;
  const idx = c.indexOf(q);
  if (idx >= 0) return 200 - idx - c.length * 0.1;
  return -1;
}

function valueForField(emp: Employee, field: Field): string {
  switch (field) {
    case "name":
      return emp.name;
    case "email":
      return emp.email;
    case "role":
      return emp.role;
  }
}

function pool(field: Field): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const emp of EMPLOYEES) {
    const v = valueForField(emp, field);
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

const POOLS: Record<Field, string[]> = {
  name: pool("name"),
  email: pool("email"),
  role: pool("role"),
};

export async function searchSuggestions(
  field: Field,
  query: string,
): Promise<FilterBaseOption<string>[]> {
  await sleep(randomLatency());

  const candidates = POOLS[field];
  const trimmed = query.trim();

  return candidates
    .map((label) => ({ label, s: score(label, trimmed) }))
    .filter(({ s }) => (trimmed ? s > 0 : true))
    .sort((a, b) => b.s - a.s)
    .slice(0, SERVER_RESULT_CAP)
    .map(
      ({ label }): FilterBaseOption<string> => ({
        id: `${field}:${label}`,
        label,
        value: label,
      }),
    );
}

async function rankEntities<T>(
  pool: readonly T[],
  query: string,
  nameKey: (entity: T) => string,
): Promise<T[]> {
  await sleep(randomLatency());
  const trimmed = query.trim();
  return pool
    .map((entity) => ({ entity, s: score(nameKey(entity), trimmed) }))
    .filter(({ s }) => (trimmed ? s > 0 : true))
    .sort((a, b) => b.s - a.s)
    .slice(0, SERVER_RESULT_CAP)
    .map(({ entity }) => entity);
}

export const searchDepartments = (query: string): Promise<Department[]> =>
  rankEntities(DEPARTMENTS, query, (d) => d.name);

export const searchSkills = (query: string): Promise<Skill[]> =>
  rankEntities(SKILLS, query, (s) => s.name);
