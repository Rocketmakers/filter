"use client";

import {
  Badge,
  Group,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { format } from "date-fns";

import { EMPLOYEES } from "@filter-builder/demo-code";
import { useFilterParams } from "@filter-builder/demo-code/integrations/examples/url/vanilla.ts";

import {
  FilterBuilder,
  filterConditions,
  useFilteredRows,
} from "@filter-builder/mantine/components/filter-builder";
import { employeeFilters } from "@filter-builder/mantine/demo/registry";

export function Example() {
  const [filters, setFilters] = useFilterParams(
    employeeFilters,
    filterConditions,
  );
  const filteredEmployees = useFilteredRows(EMPLOYEES, filters);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          Live demo · {EMPLOYEES.length} mock employees across all 6 data types
        </Text>
        <Text size="xs" c="dimmed">
          {filteredEmployees.length} / {EMPLOYEES.length}
        </Text>
      </Group>

      <FilterBuilder
        id="employee-filter-builder"
        filters={employeeFilters}
        value={filters}
        onChange={setFilters}
      />

      <Table withTableBorder striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Department</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Skills</Table.Th>
            <Table.Th style={{ textAlign: "right" }}>Salary</Table.Th>
            <Table.Th>Hired</Table.Th>
            <Table.Th>Last login</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredEmployees.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={8} ta="center">
                <Text c="dimmed">No employees match the current filters.</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            filteredEmployees.map((emp) => (
              <Table.Tr key={emp.id}>
                <Table.Td>
                  <Text fw={500}>{emp.name}</Text>
                  <Text size="xs" c="dimmed">
                    {emp.email}
                  </Text>
                </Table.Td>
                <Table.Td>{emp.department.name}</Table.Td>
                <Table.Td>{emp.role}</Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="wrap">
                    {emp.skills.map((skill) => (
                      <Badge key={skill.id} variant="light" radius="sm">
                        {skill.name}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td ta="right">${emp.salary.toLocaleString()}</Table.Td>
                <Table.Td>{format(emp.hireDate, "PP")}</Table.Td>
                <Table.Td>
                  <Text c="dimmed" size="sm">
                    {format(emp.lastLogin, "PP p")}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={emp.isActive ? "teal" : "gray"}
                    variant={emp.isActive ? "light" : "outline"}
                    radius="sm"
                  >
                    {emp.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
