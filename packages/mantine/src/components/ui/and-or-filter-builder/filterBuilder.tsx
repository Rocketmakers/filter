/**
 * FilterBuilder — grouped AND / OR condition builder (React + Mantine v7)
 * ----------------------------------------------------------------------
 * Two-level hierarchy:  (A AND B) OR C
 *   • Each GROUP joins its own conditions; every gap between conditions has
 *     its own independently toggleable AND/OR operator.
 *   • The ROOT joins groups the same way — every gap between groups has its
 *     own independently toggleable operator.
 *   • A group renders inside ( ) brackets once it holds >1 condition.
 *   • Evaluation is a plain left-to-right fold (no operator precedence).
 *
 * The component is CONTROLLED: pass `value` + `onChange`.
 * Matching / query-string helpers live in ./applyFilter so the same
 * query object can drive your table.
 *
 * Usage:
 *   const [query, setQuery] = useState<FilterQuery>(emptyQuery());
 *   <FilterBuilder value={query} onChange={setQuery} fields={FIELDS} />
 *   const rows = allRows.filter(r => matchQuery(r, query, FIELDS));
 */

import { ActionIcon, Badge, Code, Group, Paper, Stack, Text } from "@mantine/core";
import { FilterIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";

import { AddCondition } from "./addCondition";
import { buildQueryString, describeValues } from "./applyFilter";
import {
  fieldByName,
  operatorLabel,
  operatorNeedsValue,
  uid,
  type Condition,
  type FieldDef,
  type FilterQuery,
  type Join,
} from "./types";

import styles from "./filterBuilder.module.scss";

export interface FilterBuilderProps {
  value: FilterQuery;
  onChange: (next: FilterQuery) => void;
  fields: FieldDef[];
  /** show the human-readable query preview under the builder (default true) */
  showPreview?: boolean;
}

export function FilterBuilder({
  value,
  onChange,
  fields,
  showPreview = true,
}: FilterBuilderProps) {
  const { joins: rootJoins, groups } = value;

  /* --- mutations (immutable) --- */

  const toggleJoinAt = (joins: Join[], idx: number): Join[] =>
    joins.map((j, i) => (i === idx ? (j === "AND" ? "OR" : "AND") : j));

  /** removes the join adjacent to a removed item at `idx`, keeping length in sync */
  const removeJoinAt = (joins: Join[], idx: number): Join[] => {
    const next = [...joins];
    if (idx < next.length) next.splice(idx, 1);
    else if (idx > 0) next.splice(idx - 1, 1);
    return next;
  };

  const toggleRootJoin = (idx: number) =>
    onChange({ ...value, joins: toggleJoinAt(rootJoins, idx) });

  const toggleGroupJoin = (gid: string, idx: number) =>
    onChange({
      ...value,
      groups: groups.map((g) =>
        g.id === gid ? { ...g, joins: toggleJoinAt(g.joins, idx) } : g,
      ),
    });

  const addConditionToGroup = (gid: string, c: Omit<Condition, "id">) =>
    onChange({
      ...value,
      groups: groups.map((g) =>
        g.id === gid
          ? {
              ...g,
              conditions: [...g.conditions, { ...c, id: uid() }],
              joins: g.conditions.length > 0 ? [...g.joins, "AND"] : g.joins,
            }
          : g,
      ),
    });

  const addGroupWithCondition = (c: Omit<Condition, "id">) =>
    onChange({
      ...value,
      groups: [...groups, { id: uid(), joins: [], conditions: [{ ...c, id: uid() }] }],
      joins: groups.length > 0 ? [...rootJoins, "AND"] : rootJoins,
    });

  const removeGroupAt = (idx: number) =>
    onChange({
      ...value,
      groups: groups.filter((_, i) => i !== idx),
      joins: removeJoinAt(rootJoins, idx),
    });

  const removeCondition = (gid: string, cid: string) => {
    const gIdx = groups.findIndex((g) => g.id === gid);
    if (gIdx === -1) return;
    const g = groups[gIdx];
    const cIdx = g.conditions.findIndex((c) => c.id === cid);
    if (cIdx === -1) return;

    const nextConditions = g.conditions.filter((c) => c.id !== cid);
    if (nextConditions.length === 0) {
      removeGroupAt(gIdx);
      return;
    }

    onChange({
      ...value,
      groups: groups.map((grp, i) =>
        i === gIdx
          ? { ...grp, conditions: nextConditions, joins: removeJoinAt(g.joins, cIdx) }
          : grp,
      ),
    });
  };

  const removeGroup = (gid: string) => {
    const idx = groups.findIndex((g) => g.id === gid);
    if (idx !== -1) removeGroupAt(idx);
  };

  const updateCondition = (gid: string, cid: string, next: Omit<Condition, "id">) =>
    onChange({
      ...value,
      groups: groups.map((g) =>
        g.id === gid
          ? { ...g, conditions: g.conditions.map((c) => (c.id === cid ? { ...next, id: c.id } : c)) }
          : g,
      ),
    });

  const labelOf = (v: string) => fields.find((f) => f.value === v)?.label ?? v;
  const preview = buildQueryString(value, fields);

  /* --- render --- */

  return (
    <Stack gap="xs">
      <Group gap="sm" align="center" wrap="wrap">
        {groups.map((g, gi) => {
          const multi = g.conditions.length > 1;
          return (
            <Group key={g.id} gap="sm" align="center" wrap="nowrap">
              {/* root join between groups */}
              {gi > 0 && (
                <Badge
                  variant="light"
                  color="gray"
                  radius="xl"
                  size="lg"
                  className={styles.toggleBadge}
                  onClick={() => toggleRootJoin(gi - 1)}
                  title="Toggle AND / OR between groups"
                >
                  {rootJoins[gi - 1]}
                </Badge>
              )}

              {/* group box */}
              <Paper
                withBorder={multi}
                radius="md"
                p={multi ? "xs" : 4}
                bg={multi ? "green.0" : "transparent"}
                className={multi ? styles.groupBoxMulti : undefined}
              >
                <Group gap="xs" align="center" wrap="nowrap">
                  {multi && (
                    <Text c="green.5" fz={26} fw={300} lh={1}>
                      (
                    </Text>
                  )}

                  {g.conditions.map((c, ci) => (
                    <Group key={c.id} gap="xs" align="center" wrap="nowrap">
                      {/* join within group */}
                      {ci > 0 && (
                        <Badge
                          variant="light"
                          color="green"
                          radius="xl"
                          className={styles.toggleBadge}
                          onClick={() => toggleGroupJoin(g.id, ci - 1)}
                          title="Toggle AND / OR in group"
                        >
                          {g.joins[ci - 1]}
                        </Badge>
                      )}
                      {/* chip — click to edit, X to remove */}
                      <Paper withBorder radius="md" px="xs" py={6}>
                        <Group gap={8} align="center" wrap="nowrap">
                          <AddCondition
                            fields={fields}
                            initial={c}
                            onSubmit={(next) => updateCondition(g.id, c.id, next)}
                            variant="subtle"
                            size="compact-sm"
                            title="Edit condition"
                          >
                            <Group gap={8} align="center" wrap="nowrap">
                              <Text fw={600} size="sm">
                                {labelOf(c.field)}
                              </Text>
                              <Code>{operatorLabel(fieldByName(fields, c.field), c.op)}</Code>
                              {operatorNeedsValue(fieldByName(fields, c.field), c.op) &&
                                c.values.length > 0 &&
                                (c.values.length > 1 ? (
                                  <Group gap={4} wrap="nowrap">
                                    {describeValues(fieldByName(fields, c.field), c.values).map(
                                      (v, i) => (
                                        <Badge key={i} variant="light" color="gray" radius="sm">
                                          {v}
                                        </Badge>
                                      ),
                                    )}
                                  </Group>
                                ) : (
                                  <Text size="sm">
                                    {describeValues(fieldByName(fields, c.field), c.values)[0]}
                                  </Text>
                                ))}
                            </Group>
                          </AddCondition>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={() => removeCondition(g.id, c.id)}
                            title="Remove condition"
                          >
                            <XIcon size={14} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    </Group>
                  ))}

                  {/* add condition to this group */}
                  <AddCondition
                    fields={fields}
                    onSubmit={(c) => addConditionToGroup(g.id, c)}
                    title="Add condition to group"
                  >
                    <PlusIcon size={16} />
                  </AddCondition>

                  {multi && (
                    <Text c="green.5" fz={26} fw={300} lh={1}>
                      )
                    </Text>
                  )}

                  {/* remove whole group */}
                  {groups.length > 1 && (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => removeGroup(g.id)}
                      title="Remove group"
                    >
                      <Trash2Icon size={16} />
                    </ActionIcon>
                  )}
                </Group>
              </Paper>
            </Group>
          );
        })}

        {/* add group */}
        <AddCondition fields={fields} onSubmit={addGroupWithCondition}>
          <div className={styles.addGroupButton}>
            <PlusIcon size={16} />
            {groups.length === 0 ? "Filter" : "Add group"}
            {groups.length === 0 && <FilterIcon size={16} />}
          </div>
        </AddCondition>
      </Group>

      {showPreview && preview && (
        <Group gap="sm">
          <Code>{preview}</Code>
        </Group>
      )}
    </Stack>
  );
}

export default FilterBuilder;
