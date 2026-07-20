/* ------------------------------------------------------------------ */
/* Add-condition popover form                                         */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import {
  Button,
  MultiSelect,
  NumberInput,
  Popover,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";

import {
  defaultOperatorFor,
  fieldByName,
  operatorIsMultiple,
  operatorNeedsValue,
  operatorsForField,
  type Condition,
  type FieldDef,
  type Operator,
} from "./types";

import styles from "./add-condition.module.scss";

interface AddConditionProps {
  fields: FieldDef[];
  onAdd: (c: Omit<Condition, "id">) => void;
  children: React.ReactNode; // the trigger
}

export function AddCondition({ fields, onAdd, children }: AddConditionProps) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState(fields[0]?.value ?? "");
  const [op, setOp] = useState<Operator>(defaultOperatorFor(fields[0]));
  const [values, setValues] = useState<string[]>([]);

  const selectedField = fieldByName(fields, field);
  const operators = operatorsForField(selectedField);
  const needsValue = operatorNeedsValue(selectedField, op);
  const multiple = operatorIsMultiple(selectedField, op);

  const reset = () => {
    setField(fields[0]?.value ?? "");
    setOp(defaultOperatorFor(fields[0]));
    setValues([]);
  };

  const submit = () => {
    onAdd({ field, op, values: needsValue ? values : [] });
    reset();
    setOpen(false);
  };

  const selectField = (name: string) => {
    setField(name);
    setOp(defaultOperatorFor(fieldByName(fields, name)));
    setValues([]);
  };

  const selectOperator = (nextOp: Operator) => {
    setOp(nextOp);
    // switching between single- and multi-value operators would otherwise
    // leave a stale single value selected under a multi-select widget, or vice versa
    setValues([]);
  };

  return (
    <Popover
      opened={open}
      onChange={setOpen}
      position="bottom-start"
      shadow="md"
      width={320}
      withArrow
    >
      <Popover.Target>
        <span onClick={() => setOpen((o) => !o)} className={styles.trigger}>
          {children}
        </span>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm">
          <Text fw={600} size="sm">
            Add condition
          </Text>
          <Select
            label="Field"
            data={fields}
            value={field}
            onChange={(v) => v && selectField(v)}
            allowDeselect={false}
            comboboxProps={{ withinPortal: false }}
          />
          <Select
            label="Condition"
            data={operators.map((o) => ({ value: o.value, label: o.label }))}
            value={op}
            onChange={(v) => v && selectOperator(v as Operator)}
            allowDeselect={false}
            comboboxProps={{ withinPortal: false }}
          />
          {needsValue && (
            <ValueInput
              field={selectedField}
              multiple={multiple}
              values={values}
              onChange={setValues}
              onSubmit={submit}
            />
          )}
          <Button color="green" fullWidth onClick={submit}>
            Add filter
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

interface ValueInputProps {
  field: FieldDef | undefined;
  multiple: boolean;
  values: string[];
  onChange: (v: string[]) => void;
  onSubmit: () => void;
}

/** The value widget is chosen by the field's type — a number field gets a
 * NumberInput, a date field a DateInput, a select/boolean field a picklist
 * (MultiSelect for "is one of" / "is none of"), and everything else a plain
 * TextInput. */
function ValueInput({ field, multiple, values, onChange, onSubmit }: ValueInputProps) {
  const value = values[0] ?? "";
  const setSingle = (v: string) => onChange(v ? [v] : []);

  if (field?.type === "select" && multiple) {
    return (
      <MultiSelect
        label="Value"
        placeholder="Select values…"
        data={field.options ?? []}
        value={values}
        onChange={onChange}
        comboboxProps={{ withinPortal: false }}
        searchable
        data-autofocus
      />
    );
  }

  switch (field?.type) {
    case "number":
      return (
        <NumberInput
          label="Value"
          placeholder="Enter value…"
          value={value === "" ? "" : Number(value)}
          onChange={(v) => setSingle(v === "" ? "" : String(v))}
          data-autofocus
        />
      );
    case "date":
      return (
        <DateInput
          label="Value"
          placeholder="Pick a date…"
          value={value ? new Date(value) : null}
          onChange={(v) => setSingle(v ? new Date(v).toISOString() : "")}
          data-autofocus
        />
      );
    case "boolean":
      return (
        <Select
          label="Value"
          data={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
          value={value || null}
          onChange={(v) => setSingle(v ?? "")}
          allowDeselect={false}
          comboboxProps={{ withinPortal: false }}
        />
      );
    case "select":
      return (
        <Select
          label="Value"
          data={field.options ?? []}
          value={value || null}
          onChange={(v) => setSingle(v ?? "")}
          allowDeselect={false}
          comboboxProps={{ withinPortal: false }}
        />
      );
    default:
      return (
        <TextInput
          label="Value"
          placeholder="Enter value…"
          value={value}
          onChange={(e) => setSingle(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          data-autofocus
        />
      );
  }
}
