import {
  ActionIcon,
  Badge,
  Container,
  Group,
  Stack,
  Table,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { format } from "date-fns";
import { MoonIcon, SunIcon } from "lucide-react";

import { DEPARTMENTS, EMPLOYEES } from "@filter-builder/demo-code";

import {
  FilterBuilder,
  matchQuery,
  useUrlFilterQuery,
  type FieldDef,
} from "@/components/ui/and-or-filter-builder";

import styles from "./App.module.scss";

const FIELDS: FieldDef[] = [
  { value: "name", label: "Name", type: "text" },
  { value: "email", label: "Email", type: "text" },
  {
    value: "department",
    label: "Department",
    type: "select",
    options: DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })),
  },
  { value: "role", label: "Role", type: "text" },
  { value: "skills", label: "Skills", type: "text" },
  { value: "salary", label: "Salary", type: "number" },
  { value: "hireDate", label: "Hired", type: "date" },
  { value: "isActive", label: "Active", type: "boolean" },
];

type Row = ReturnType<typeof toRow>;

function toRow(emp: (typeof EMPLOYEES)[number]) {
  return {
    id: emp.id,
    name: emp.name,
    email: emp.email,
    department: emp.department.id,
    role: emp.role,
    skills: emp.skills.map((s) => s.name).join(", "),
    salary: emp.salary,
    hireDate: emp.hireDate,
    isActive: emp.isActive,
  };
}

const rows = EMPLOYEES.map(toRow);

function Cell({ field, row }: { field: FieldDef; row: Row }) {
  const raw = row[field.value as keyof Row];
  switch (field.type) {
    case "date":
      return <>{raw instanceof Date ? format(raw, "PP") : ""}</>;
    case "number":
      return <>{typeof raw === "number" ? `$${raw.toLocaleString()}` : ""}</>;
    case "boolean":
      return (
        <Badge color={raw ? "teal" : "gray"} variant={raw ? "light" : "outline"} radius="sm">
          {raw ? "Active" : "Inactive"}
        </Badge>
      );
    case "select":
      return <>{field.options?.find((o) => o.value === raw)?.label ?? String(raw ?? "")}</>;
    default:
      return <>{String(raw ?? "")}</>;
  }
}

export default function AndOrApp() {
  const [query, setQuery] = useUrlFilterQuery(FIELDS);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const filteredRows = rows.filter((r) => matchQuery(r, query, FIELDS));

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Container size="xl" py="xl">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2}>filter-builder · Mantine (AND/OR groups)</Title>
              <Text c="dimmed" size="sm" mt={4}>
                Grouped AND / OR condition builder — text, select, number, date
                and boolean fields — over {EMPLOYEES.length} mock employees.
              </Text>
            </div>
            <Group gap="md">
              <Text size="xs" c="dimmed">
                {filteredRows.length} / {rows.length}
              </Text>
              <ActionIcon
                variant="default"
                size="lg"
                aria-label="Toggle theme"
                onClick={toggleColorScheme}
              >
                {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </header>

      <Container size="xl" py="md">
        <Stack gap="md">
          <FilterBuilder value={query} onChange={setQuery} fields={FIELDS} />

          <Table withTableBorder striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {FIELDS.map((f) => (
                  <Table.Th key={f.value}>{f.label}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredRows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={FIELDS.length} ta="center">
                    <Text c="dimmed">No employees match the current filters.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredRows.map((r) => (
                  <Table.Tr key={r.id}>
                    {FIELDS.map((f) => (
                      <Table.Td key={f.value}>
                        <Cell field={f} row={r} />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      </Container>
    </div>
  );
}
