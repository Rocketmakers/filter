import { CodeHighlight } from "@mantine/code-highlight";
import {
  Badge,
  Button,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/class-names";

import {
  integrationGroups,
  type IntegrationExample,
  type IntegrationGroup,
  type ResolvedQuestionGroup,
  type ResolvedTileGroup,
  type ResolvedVariant,
} from "./examples";
import { getLogo } from "./logos";
import { useIntegrationsState, type WizardState } from "./state";

import styles from "./integrations.module.scss";

function isEnabled(
  group: IntegrationGroup,
  state: WizardState,
): boolean {
  const gate = group.enabledWhen;
  if (!gate) return true;
  for (const key of Object.keys(gate)) {
    const allowedValues = gate[key];
    const current = state[key];
    if (!current || !allowedValues.includes(current)) return false;
  }
  return true;
}

/**
 * Walk every group with its `enabledWhen` gate against the candidate wizard
 * state and drop any selections (answer / tile pick / tile toggle) for
 * groups that aren't enabled. Iterates until stable so cascades resolve
 * (e.g. clearing storage → backend question disabled → clear backend answer
 * → group-transport/server/in-memory disabled → clear their tile picks).
 */
function reconcileSelections(
  wizardState: WizardState,
  selectedExamples: Record<string, string | null>,
  perTileToggles: Record<string, Record<string, string>>,
): {
  wizardState: WizardState;
  selectedExamples: Record<string, string | null>;
  perTileToggles: Record<string, Record<string, string>>;
} {
  let nextWizard = wizardState;
  let nextExamples = selectedExamples;
  let nextToggles = perTileToggles;
  let changed = true;
  while (changed) {
    changed = false;
    for (const group of integrationGroups) {
      if (isEnabled(group, nextWizard)) continue;
      if (group.kind === "question") {
        if (nextWizard[group.stateKey] !== undefined) {
          const { [group.stateKey]: _drop, ...rest } = nextWizard;
          nextWizard = rest;
          changed = true;
        }
      } else {
        if (nextExamples[group.id]) {
          nextExamples = { ...nextExamples, [group.id]: null };
          changed = true;
        }
        if (nextToggles[group.id]) {
          const { [group.id]: _drop, ...rest } = nextToggles;
          nextToggles = rest;
          changed = true;
        }
      }
    }
  }
  return {
    wizardState: nextWizard,
    selectedExamples: nextExamples,
    perTileToggles: nextToggles,
  };
}

export function BackendIntegrations() {
  const {
    wizardState,
    selectedExamples,
    perTileToggles,
    setWizardState,
    setSelectedExamples,
    setPerTileToggles,
  } = useIntegrationsState();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /**
   * Toggle a question answer. Re-clicking the active option clears it,
   * which cascades through `reconcileSelections` to drop any dependent
   * tile picks (e.g. clearing storage also clears backend + group-transport
   * + group-server selections).
   */
  const pickQuestionAnswer = useCallback(
    (stateKey: string, value: string) => {
      const current = wizardState[stateKey];
      let nextWizard: WizardState;
      if (current === value) {
        const { [stateKey]: _drop, ...rest } = wizardState;
        nextWizard = rest;
      } else {
        nextWizard = { ...wizardState, [stateKey]: value };
      }
      const reconciled = reconcileSelections(
        nextWizard,
        selectedExamples,
        perTileToggles,
      );
      setWizardState(reconciled.wizardState);
      setSelectedExamples(reconciled.selectedExamples);
      setPerTileToggles(reconciled.perTileToggles);
    },
    [
      wizardState,
      selectedExamples,
      perTileToggles,
      setWizardState,
      setSelectedExamples,
      setPerTileToggles,
    ],
  );

  /** Scroll the named section into view (smooth, with header offset). */
  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /**
   * After a wizard answer changes, scroll to the first section that's
   * newly enabled (i.e., the one the user should fill out next).
   */
  const previousState = useRef<WizardState>({});
  useEffect(() => {
    const prev = previousState.current;
    const next = wizardState;
    previousState.current = next;

    for (const group of integrationGroups) {
      const wasEnabled = isEnabled(group, prev);
      const nowEnabled = isEnabled(group, next);
      if (!wasEnabled && nowEnabled) {
        scrollToSection(group.id);
        return;
      }
    }
  }, [wizardState, scrollToSection]);

  return (
    <Stack gap="xl">
      {integrationGroups.map((group) => {
        const enabled = isEnabled(group, wizardState);
        const setRef = (el: HTMLDivElement | null) => {
          sectionRefs.current[group.id] = el;
        };

        if (group.kind === "question") {
          return (
            <QuestionSection
              key={group.id}
              group={group}
              enabled={enabled}
              activeValue={wizardState[group.stateKey] ?? null}
              onPick={(value) => pickQuestionAnswer(group.stateKey, value)}
              setRef={setRef}
            />
          );
        }

        return (
          <TilesSectionUI
            key={group.id}
            group={group}
            enabled={enabled}
            selectedExampleId={selectedExamples[group.id] ?? null}
            onSelect={(id) =>
              setSelectedExamples((prev) => ({ ...prev, [group.id]: id }))
            }
            toggleState={perTileToggles[group.id] ?? {}}
            onToggleChange={(toggleId, value) =>
              setPerTileToggles((prev) => ({
                ...prev,
                [group.id]: { ...(prev[group.id] ?? {}), [toggleId]: value },
              }))
            }
            setRef={setRef}
          />
        );
      })}
    </Stack>
  );
}

function Blurb({ children }: { children: string }) {
  const parts = children.split("`");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className={styles.inlineCode}>
            {part}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function QuestionSection({
  group,
  enabled,
  activeValue,
  onPick,
  setRef,
}: {
  group: ResolvedQuestionGroup;
  enabled: boolean;
  activeValue: string | null;
  onPick: (value: string) => void;
  setRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={setRef}
      className={cn(
        styles.groupHeader,
        !enabled && styles.groupDisabled,
      )}
      aria-disabled={!enabled}
    >
      <Stack gap="md" id={group.id}>
        <div>
          <Title order={3}>{group.title}</Title>
          <Text c="dimmed" size="sm" mt={4}>
            <Blurb>{group.blurb}</Blurb>
          </Text>
        </div>
        <div className={styles.tileGrid}>
          {group.options.map((opt) => {
            const isActive = activeValue === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={cn(
                  styles.tile,
                  isActive && styles.tileActive,
                )}
                disabled={!enabled}
                aria-pressed={isActive}
                onClick={() => onPick(opt.id)}
              >
                {opt.badge ? (
                  <span className={styles.tileBadge}>{opt.badge}</span>
                ) : null}
                <span className={styles.tileLogo}>{getLogo(opt.logoKey)}</span>
                <span className={styles.tileTitle}>{opt.label}</span>
                {opt.blurb ? (
                  <span className={styles.tileBlurb}>
                    <Blurb>{opt.blurb}</Blurb>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Stack>
    </div>
  );
}

function buildVariantKey(
  toggles: ResolvedTileGroup["toggles"],
  state: Record<string, string>,
): string {
  if (!toggles || toggles.length === 0) return "";
  return toggles.map((t) => state[t.id] ?? t.defaultId).join("-");
}

function TilesSectionUI({
  group,
  enabled,
  selectedExampleId,
  onSelect,
  toggleState,
  onToggleChange,
  setRef,
}: {
  group: ResolvedTileGroup;
  enabled: boolean;
  selectedExampleId: string | null;
  onSelect: (id: string | null) => void;
  toggleState: Record<string, string>;
  onToggleChange: (toggleId: string, value: string) => void;
  setRef: (el: HTMLDivElement | null) => void;
}) {
  const selected = selectedExampleId
    ? (group.examples.find((e) => e.id === selectedExampleId) ?? null)
    : null;

  const effectiveToggleState: Record<string, string> = {};
  for (const toggle of group.toggles ?? []) {
    effectiveToggleState[toggle.id] =
      toggleState[toggle.id] ?? toggle.defaultId;
  }
  const variantKey = buildVariantKey(group.toggles, effectiveToggleState);

  const variantTags: string[] =
    group.toggles?.map((t) => {
      const id = effectiveToggleState[t.id];
      return t.options.find((o) => o.id === id)?.label ?? id;
    }) ?? [];

  return (
    <div
      ref={setRef}
      className={cn(
        styles.groupHeader,
        !enabled && styles.groupDisabled,
      )}
      aria-disabled={!enabled}
    >
      <Stack gap="md" id={group.id}>
        <div>
          <Title order={3}>{group.title}</Title>
          <Text c="dimmed" size="sm" mt={4}>
            <Blurb>{group.blurb}</Blurb>
          </Text>
        </div>

        {group.toggles && group.toggles.length > 0 ? (
          <Group gap="lg" wrap="wrap" align="flex-end">
            {group.toggles.map((toggle) => (
              <Stack key={toggle.id} gap={4}>
                <Text size="xs" c="dimmed">
                  {toggle.label}
                </Text>
                <SegmentedControl
                  size="xs"
                  disabled={!enabled}
                  value={effectiveToggleState[toggle.id]}
                  onChange={(value) => onToggleChange(toggle.id, value)}
                  data={toggle.options.map((o) => ({
                    value: o.id,
                    label: o.label,
                  }))}
                />
              </Stack>
            ))}
          </Group>
        ) : null}

        <TileGrid
          examples={group.examples}
          variantTags={variantTags}
          disabled={!enabled}
          selectedId={selected?.id ?? null}
          onSelect={(id) => onSelect(id === selectedExampleId ? null : id)}
        />

        {selected && enabled ? (
          <SelectedDetail
            example={selected}
            variantKey={variantKey}
            variantTags={variantTags}
          />
        ) : null}
      </Stack>
    </div>
  );
}

function TileGrid({
  examples,
  variantTags,
  disabled,
  selectedId,
  onSelect,
}: {
  examples: IntegrationExample[];
  variantTags: string[];
  disabled: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.tileGrid}>
      {examples.map((ex) => {
        const isSelected = ex.id === selectedId;
        return (
          <button
            key={ex.id}
            type="button"
            className={cn(styles.tile, isSelected && styles.tileActive)}
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => onSelect(ex.id)}
          >
            {ex.badge ? (
              <span className={styles.tileBadge}>{ex.badge}</span>
            ) : null}
            {variantTags.length > 0 && ex.variants ? (
              <span className={styles.tileVariantTags}>
                {variantTags.map((label, i) => (
                  <span key={i} className={styles.tileVariantTag}>
                    {label}
                  </span>
                ))}
              </span>
            ) : null}
            <span className={styles.tileLogo}>{getLogo(ex.logoKey)}</span>
            <span className={styles.tileTitle}>{ex.title}</span>
          </button>
        );
      })}
    </div>
  );
}

function SelectedDetail({
  example,
  variantKey,
  variantTags,
}: {
  example: IntegrationExample;
  variantKey: string;
  variantTags: string[];
}) {
  const [showCode, setShowCode] = useState(false);

  const variant: ResolvedVariant | null = example.variants
    ? (example.variants[variantKey] ??
      Object.values(example.variants)[0] ??
      null)
    : null;

  const blurb = variant?.blurb ?? example.blurb ?? "";
  const code = variant?.code ?? example.code ?? "";
  const language = variant?.language ?? example.language ?? "ts";

  return (
    <Stack gap="sm" id={example.id} className={styles.section}>
      <Group gap="xs" align="center">
        <Title order={4} m={0}>
          {example.title}
        </Title>
        {example.variants
          ? variantTags.map((label, i) => (
              <Badge key={i} color="gray" radius="sm" variant="light">
                {label}
              </Badge>
            ))
          : null}
        {example.badge ? (
          <Badge color="blue" radius="sm" variant="light">
            {example.badge}
          </Badge>
        ) : null}
      </Group>

      <Text c="dimmed" size="sm">
        <Blurb>{blurb}</Blurb>
      </Text>

      <Button
        variant="default"
        size="xs"
        leftSection={
          showCode ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />
        }
        onClick={() => setShowCode((v) => !v)}
        aria-expanded={showCode}
        style={{ alignSelf: "flex-start" }}
      >
        {showCode ? "Hide code" : "Show code"}
      </Button>

      {showCode ? (
        <CodeHighlight code={code} language={language} />
      ) : null}
    </Stack>
  );
}

export { OnThisPage } from "./toc";
