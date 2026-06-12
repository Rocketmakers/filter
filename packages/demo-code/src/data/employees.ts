export type Department = { id: string; name: string };
export type Skill = { id: string; name: string };

export type Employee = {
  id: string;
  name: string;
  email: string;
  department: Department;
  role: string;
  skills: Skill[];
  salary: number;
  hireDate: Date;
  lastLogin: Date;
  isActive: boolean;
  /** Past handles / preferred nicknames — exercises plural-text filters. */
  aliases?: string[];
  /** Most recent four quarterly performance scores — exercises plural-number. */
  quarterlyScores?: number[];
  /** Each annual review date — exercises plural-date filters. */
  performanceReviewDates?: Date[];
  /** Recent shift start times — exercises plural-dateTime filters. */
  shiftStarts?: Date[];
};

export const DEPARTMENTS: Department[] = [
  { id: "eng", name: "Engineering" },
  { id: "design", name: "Design" },
  { id: "product", name: "Product" },
  { id: "sales", name: "Sales" },
  { id: "ops", name: "Operations" },
];

export const SKILLS: Skill[] = [
  { id: "ts", name: "TypeScript" },
  { id: "react", name: "React" },
  { id: "node", name: "Node.js" },
  { id: "rust", name: "Rust" },
  { id: "go", name: "Go" },
  { id: "figma", name: "Figma" },
  { id: "sql", name: "SQL" },
  { id: "k8s", name: "Kubernetes" },
  { id: "research", name: "User Research" },
  { id: "copy", name: "Copywriting" },
];

const d = (iso: string) => new Date(iso);

export const EMPLOYEES: Employee[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", department: DEPARTMENTS[0], role: "Staff Engineer", skills: [SKILLS[0], SKILLS[1], SKILLS[3]], salary: 175000, hireDate: d("2019-04-12"), lastLogin: d("2026-06-04T09:14:00"), isActive: true,
    aliases: ["countess", "enchantress of numbers"],
    quarterlyScores: [4.2, 4.5, 4.7, 4.8],
    performanceReviewDates: [d("2020-04-15"), d("2021-04-12"), d("2022-04-10"), d("2023-04-15"), d("2024-04-18"), d("2025-04-14")],
    shiftStarts: [d("2026-06-01T09:00:00"), d("2026-06-02T09:05:00"), d("2026-06-03T08:55:00"), d("2026-06-04T09:00:00")] },
  { id: "2", name: "Grace Hopper", email: "grace@example.com", department: DEPARTMENTS[0], role: "Principal Engineer", skills: [SKILLS[0], SKILLS[2], SKILLS[6]], salary: 210000, hireDate: d("2016-08-01"), lastLogin: d("2026-06-05T07:43:00"), isActive: true,
    aliases: ["amazing grace", "the queen of code"],
    quarterlyScores: [4.8, 4.9, 4.9, 5.0],
    performanceReviewDates: [d("2017-08-04"), d("2018-08-03"), d("2019-08-02"), d("2020-08-07"), d("2021-08-06"), d("2022-08-05"), d("2023-08-04"), d("2024-08-02"), d("2025-08-08")],
    shiftStarts: [d("2026-06-01T07:30:00"), d("2026-06-02T07:45:00"), d("2026-06-03T07:30:00")] },
  { id: "3", name: "Alan Turing", email: "alan@example.com", department: DEPARTMENTS[0], role: "Engineer", skills: [SKILLS[3], SKILLS[4]], salary: 145000, hireDate: d("2021-11-22"), lastLogin: d("2026-05-30T18:02:00"), isActive: true,
    aliases: ["the prof"],
    quarterlyScores: [3.8, 4.0, 4.1, 3.9],
    performanceReviewDates: [d("2022-11-25"), d("2023-11-24"), d("2024-11-22"), d("2025-11-21")] },
  { id: "4", name: "Margaret Hamilton", email: "margaret@example.com", department: DEPARTMENTS[2], role: "Product Lead", skills: [SKILLS[8]], salary: 165000, hireDate: d("2020-02-17"), lastLogin: d("2026-06-04T14:55:00"), isActive: true },
  { id: "5", name: "Hedy Lamarr", email: "hedy@example.com", department: DEPARTMENTS[1], role: "Senior Designer", skills: [SKILLS[5], SKILLS[8]], salary: 130000, hireDate: d("2022-06-09"), lastLogin: d("2026-06-03T11:11:00"), isActive: true },
  { id: "6", name: "Katherine Johnson", email: "katherine@example.com", department: DEPARTMENTS[4], role: "Operations Manager", skills: [SKILLS[6]], salary: 120000, hireDate: d("2018-09-03"), lastLogin: d("2026-04-18T09:00:00"), isActive: false },
  { id: "7", name: "Linus Torvalds", email: "linus@example.com", department: DEPARTMENTS[0], role: "Engineer", skills: [SKILLS[2], SKILLS[7]], salary: 155000, hireDate: d("2017-01-15"), lastLogin: d("2026-06-05T08:30:00"), isActive: true,
    aliases: ["benevolent dictator", "torvalds"],
    quarterlyScores: [4.5, 4.6, 4.4, 4.5],
    performanceReviewDates: [d("2018-01-18"), d("2019-01-17"), d("2020-01-16"), d("2021-01-15"), d("2022-01-14"), d("2023-01-13"), d("2024-01-12"), d("2025-01-17")],
    shiftStarts: [d("2026-06-01T08:00:00"), d("2026-06-02T08:00:00"), d("2026-06-03T08:00:00"), d("2026-06-04T08:00:00")] },
  { id: "8", name: "Tim Berners-Lee", email: "tim@example.com", department: DEPARTMENTS[0], role: "Engineer", skills: [SKILLS[0], SKILLS[1]], salary: 140000, hireDate: d("2023-03-01"), lastLogin: d("2026-06-02T16:22:00"), isActive: true },
  { id: "9", name: "Brendan Eich", email: "brendan@example.com", department: DEPARTMENTS[3], role: "Account Executive", skills: [SKILLS[9]], salary: 110000, hireDate: d("2024-05-20"), lastLogin: d("2026-05-29T13:14:00"), isActive: true },
  { id: "10", name: "Anita Borg", email: "anita@example.com", department: DEPARTMENTS[2], role: "Product Manager", skills: [SKILLS[8], SKILLS[9]], salary: 150000, hireDate: d("2021-07-04"), lastLogin: d("2026-06-04T19:01:00"), isActive: true },
  { id: "11", name: "Donald Knuth", email: "don@example.com", department: DEPARTMENTS[0], role: "Distinguished Engineer", skills: [SKILLS[0], SKILLS[3], SKILLS[4], SKILLS[6]], salary: 250000, hireDate: d("2014-10-10"), lastLogin: d("2026-06-01T07:00:00"), isActive: true,
    aliases: ["the art of programming"],
    quarterlyScores: [4.9, 5.0, 5.0, 4.9],
    performanceReviewDates: [d("2015-10-12"), d("2016-10-11"), d("2017-10-09"), d("2018-10-08"), d("2019-10-14"), d("2020-10-12"), d("2021-10-11"), d("2022-10-10"), d("2023-10-09"), d("2024-10-14"), d("2025-10-13")],
    shiftStarts: [d("2026-06-01T07:00:00"), d("2026-06-02T07:00:00"), d("2026-06-03T07:00:00")] },
  { id: "12", name: "Susan Kare", email: "susan@example.com", department: DEPARTMENTS[1], role: "Designer", skills: [SKILLS[5]], salary: 105000, hireDate: d("2023-11-13"), lastLogin: d("2026-05-28T10:45:00"), isActive: true },
  { id: "13", name: "John Carmack", email: "john@example.com", department: DEPARTMENTS[0], role: "Engineer", skills: [SKILLS[2], SKILLS[3], SKILLS[4]], salary: 180000, hireDate: d("2020-12-01"), lastLogin: d("2026-06-05T01:18:00"), isActive: false },
  { id: "14", name: "Mary Allen Wilkes", email: "mary@example.com", department: DEPARTMENTS[4], role: "Operations", skills: [SKILLS[6], SKILLS[8]], salary: 95000, hireDate: d("2025-01-19"), lastLogin: d("2026-06-05T08:15:00"), isActive: true },
  { id: "15", name: "Bjarne Stroustrup", email: "bjarne@example.com", department: DEPARTMENTS[0], role: "Engineer", skills: [SKILLS[2], SKILLS[3]], salary: 160000, hireDate: d("2015-05-05"), lastLogin: d("2025-12-20T10:00:00"), isActive: false },
];
