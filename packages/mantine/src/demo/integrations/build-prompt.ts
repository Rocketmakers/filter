import {
  integrationGroups,
  type IntegrationExample,
  type IntegrationGroup,
  type ResolvedTileGroup,
} from "./examples";
import type { WizardState } from "./state";

export type Stack = "mantine" | "stylex" | "tailwind-shadcn";

export type Pick = {
  /** Section the pick came from (group title). */
  section: string;
  /** Human label for the pick. */
  label: string;
  /** Logo key — used by the icon strip on the button. */
  logoKey: string;
};

export type BuildPromptResult = {
  /** All required selections are made — button can be enabled. */
  ready: boolean;
  /** Group titles still missing a selection. */
  missing: string[];
  /** Logo keys to render in the icon strip, in selection order. */
  picks: Pick[];
  /** The markdown prompt to copy. Always non-empty so users can preview. */
  markdown: string;
};

const STACK_META: Record<
  Stack,
  { label: string; install: string; importBase: string }
> = {
  mantine: {
    label: "Mantine v8 + SCSS modules",
    install: "npx @rocketmakers/filter mantine",
    importBase: "@/components/ui/filter-builder",
  },
  stylex: {
    label: "StyleX + Radix + cmdk",
    install: "npx @rocketmakers/filter stylex",
    importBase: "@/components/ui/filter-builder",
  },
  "tailwind-shadcn": {
    label: "Tailwind v4 + shadcn/ui",
    install:
      "npx shadcn@latest add https://rocketmakers.github.io/filter/r/filter-builder-tailwind.json",
    importBase: "@/components/ui/filter-builder",
  },
};

function findTileGroup(id: string): ResolvedTileGroup | null {
  const group = integrationGroups.find(
    (g): g is ResolvedTileGroup => g.kind === "tiles" && g.id === id,
  );
  return group ?? null;
}

function findQuestionGroup(id: string): Extract<
  IntegrationGroup,
  { kind: "question" }
> | null {
  const group = integrationGroups.find(
    (g): g is Extract<IntegrationGroup, { kind: "question" }> =>
      g.kind === "question" && g.id === id,
  );
  return group ?? null;
}

function buildVariantKey(
  group: ResolvedTileGroup,
  toggleState: Record<string, string>,
): string {
  if (!group.toggles || group.toggles.length === 0) return "";
  return group.toggles
    .map((t) => toggleState[t.id] ?? t.defaultId)
    .join("-");
}

function getResolvedCode(
  example: IntegrationExample,
  variantKey: string,
): { code: string; language: string; sourcePath: string } {
  if (example.variants) {
    const variant =
      example.variants[variantKey] ?? Object.values(example.variants)[0];
    return {
      code: variant?.code ?? "",
      language: variant?.language ?? "tsx",
      sourcePath: variant?.sourcePath ?? "",
    };
  }
  return {
    code: example.code ?? "",
    language: example.language ?? "ts",
    sourcePath: example.sourcePath ?? "",
  };
}

function tilePick(
  group: ResolvedTileGroup,
  exampleId: string | null,
  toggleState: Record<string, string>,
): {
  example: IntegrationExample | null;
  variantKey: string;
  variantTags: string[];
} {
  const variantKey = buildVariantKey(group, toggleState);
  if (!exampleId) {
    return { example: null, variantKey, variantTags: [] };
  }
  const example = group.examples.find((e) => e.id === exampleId) ?? null;
  const variantTags =
    group.toggles?.map((t) => {
      const id = toggleState[t.id] ?? t.defaultId;
      return t.options.find((o) => o.id === id)?.label ?? id;
    }) ?? [];
  return { example, variantKey, variantTags };
}

function codeBlock(language: string, code: string): string {
  const fence = code.includes("```") ? "````" : "```";
  return `${fence}${language}\n${code.trim()}\n${fence}`;
}

function sourceCitation(sourcePath: string): string {
  return sourcePath
    ? `_Reference: \`${sourcePath}\` (in the @rocketmakers/filter registry)._`
    : "";
}

export function buildPrompt(
  stack: Stack,
  wizardState: WizardState,
  selectedExamples: Record<string, string | null>,
  perTileToggles: Record<string, Record<string, string>>,
): BuildPromptResult {
  const meta = STACK_META[stack];
  const picks: Pick[] = [];
  const missing: string[] = [];
  const sections: string[] = [];

  // 1. Storage question.
  const storageQuestion = findQuestionGroup("question-storage");
  const storage = wizardState["storage"];
  if (storageQuestion) {
    if (!storage) {
      missing.push(storageQuestion.title);
    } else {
      const opt = storageQuestion.options.find((o) => o.id === storage);
      if (opt) {
        picks.push({
          section: storageQuestion.title,
          label: opt.label,
          logoKey: opt.logoKey,
        });
      }
    }
  }

  // 2. URL sync (when storage = url / both).
  if (storage === "url" || storage === "both") {
    const urlGroup = findTileGroup("group-url");
    if (urlGroup) {
      const sel = selectedExamples["group-url"] ?? null;
      const { example, variantKey } = tilePick(
        urlGroup,
        sel,
        perTileToggles["group-url"] ?? {},
      );
      if (!example) {
        missing.push(urlGroup.title);
      } else {
        picks.push({
          section: urlGroup.title,
          label: example.title,
          logoKey: example.logoKey,
        });
        const resolved = getResolvedCode(example, variantKey);
        sections.push(
          [
            `### URL sync — ${example.title}`,
            "",
            example.blurb ?? "",
            "",
            sourceCitation(resolved.sourcePath),
            "",
            codeBlock(resolved.language, resolved.code),
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }
    }
  }

  // 3. State manager (when storage = state / both).
  if (storage === "state" || storage === "both") {
    const stateGroup = findTileGroup("group-state");
    if (stateGroup) {
      const sel = selectedExamples["group-state"] ?? null;
      const { example, variantKey } = tilePick(
        stateGroup,
        sel,
        perTileToggles["group-state"] ?? {},
      );
      if (!example) {
        missing.push(stateGroup.title);
      } else {
        picks.push({
          section: stateGroup.title,
          label: example.title,
          logoKey: example.logoKey,
        });
        const resolved = getResolvedCode(example, variantKey);
        sections.push(
          [
            `### State manager — ${example.title}`,
            "",
            example.blurb ?? "",
            "",
            sourceCitation(resolved.sourcePath),
            "",
            codeBlock(resolved.language, resolved.code),
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }
    }
  }

  // 4. Backend question.
  const backendQuestion = findQuestionGroup("question-backend");
  const backend = storage ? wizardState["backend"] : undefined;
  if (backendQuestion && storage) {
    if (!backend) {
      missing.push(backendQuestion.title);
    } else {
      const opt = backendQuestion.options.find((o) => o.id === backend);
      if (opt) {
        picks.push({
          section: backendQuestion.title,
          label: opt.label,
          logoKey: opt.logoKey,
        });
      }
    }
  }

  // 5. Transport + 6. Server (backend = yes) or 7. In-memory (backend = no).
  if (backend === "yes") {
    const transportGroup = findTileGroup("group-transport");
    if (transportGroup) {
      const sel = selectedExamples["group-transport"] ?? null;
      const toggles = perTileToggles["group-transport"] ?? {};
      const { example, variantKey, variantTags } = tilePick(
        transportGroup,
        sel,
        toggles,
      );
      if (!example) {
        missing.push(transportGroup.title);
      } else {
        const tagSuffix =
          variantTags.length > 0 ? ` · ${variantTags.join(" · ")}` : "";
        picks.push({
          section: transportGroup.title,
          label: `${example.title}${tagSuffix}`,
          logoKey: example.logoKey,
        });
        const resolved = getResolvedCode(example, variantKey);
        sections.push(
          [
            `### Send filters to the API — ${example.title}${tagSuffix}`,
            "",
            example.blurb ?? "",
            "",
            sourceCitation(resolved.sourcePath),
            "",
            codeBlock(resolved.language, resolved.code),
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }
    }

    const serverGroup = findTileGroup("group-server");
    if (serverGroup) {
      const sel = selectedExamples["group-server"] ?? null;
      const { example, variantKey } = tilePick(
        serverGroup,
        sel,
        perTileToggles["group-server"] ?? {},
      );
      if (!example) {
        missing.push(serverGroup.title);
      } else {
        picks.push({
          section: serverGroup.title,
          label: example.title,
          logoKey: example.logoKey,
        });
        const resolved = getResolvedCode(example, variantKey);
        sections.push(
          [
            `### Server-side query — ${example.title}`,
            "",
            example.blurb ?? "",
            "",
            sourceCitation(resolved.sourcePath),
            "",
            codeBlock(resolved.language, resolved.code),
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }
    }
  } else if (backend === "no") {
    const inMemoryGroup = findTileGroup("group-in-memory");
    if (inMemoryGroup) {
      const sel = selectedExamples["group-in-memory"] ?? null;
      const { example, variantKey } = tilePick(
        inMemoryGroup,
        sel,
        perTileToggles["group-in-memory"] ?? {},
      );
      if (!example) {
        missing.push(inMemoryGroup.title);
      } else {
        picks.push({
          section: inMemoryGroup.title,
          label: example.title,
          logoKey: example.logoKey,
        });
        const resolved = getResolvedCode(example, variantKey);
        sections.push(
          [
            `### Client-side filtering — ${example.title}`,
            "",
            example.blurb ?? "",
            "",
            sourceCitation(resolved.sourcePath),
            "",
            codeBlock(resolved.language, resolved.code),
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }
    }
  }

  const ready = missing.length === 0;

  const choicesList = picks
    .map((p) => `- **${p.section}:** ${p.label}`)
    .join("\n");

  const header = [
    `# Add the \`FilterBuilder\` component (${meta.label})`,
    "",
    "Please add the `FilterBuilder` compound component to this project and wire it up with the choices below.",
    "",
    "## 1. Install",
    "",
    "Run from the project root:",
    "",
    codeBlock("sh", meta.install),
    "",
    "This pulls the manifest from `https://rocketmakers.github.io/filter/r/`, writes the component source under `src/components/ui/filter-builder/`, and installs the runtime + dev npm dependencies with the project's package manager.",
    "",
    "Import the component as:",
    "",
    codeBlock(
      "tsx",
      `import {
  FilterBuilder,
  filterConditions,
  useFilteredRows,
} from "${meta.importBase}";`,
    ),
    "",
    "## 2. Choices",
    "",
    choicesList || "_(no choices selected yet)_",
    "",
  ].join("\n");

  const stepsHeader =
    sections.length > 0 ? "## 3. Implementation steps\n\n" : "";
  const trailer = ready
    ? ""
    : `\n\n---\n\n_Still to pick before this prompt is complete: ${missing
        .map((m) => `**${m}**`)
        .join(", ")}._\n`;

  const markdown = `${header}${stepsHeader}${sections.join("\n\n")}${trailer}`;

  return { ready, missing, picks, markdown };
}
