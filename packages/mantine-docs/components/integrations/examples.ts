import {
  integrationGroups as metadataGroups,
  tocSections as metadataTocSections,
  type ExampleVariant as MetadataVariant,
  type IntegrationExample as Metadata,
  type IntegrationGroup as MetadataGroup,
  type QuestionGroup,
  type TocSection,
} from "@filter-builder/demo-code";

import { exampleSources } from "./example-sources.generated";

export type ResolvedVariant = MetadataVariant & { code: string };
export type IntegrationExample = Omit<Metadata, "variants"> & {
  code?: string;
  variants?: Record<string, ResolvedVariant>;
};
export type ResolvedTileGroup = Omit<
  Extract<MetadataGroup, { kind: "tiles" }>,
  "examples"
> & {
  kind: "tiles";
  examples: IntegrationExample[];
};
export type ResolvedQuestionGroup = QuestionGroup;
export type IntegrationGroup = ResolvedTileGroup | ResolvedQuestionGroup;

const sourceFor = (path: string | undefined): string =>
  path ? (exampleSources[path] ?? "") : "";

export const integrationGroups: IntegrationGroup[] = metadataGroups.map(
  (group): IntegrationGroup => {
    if (group.kind === "question") {
      return group;
    }
    return {
      ...group,
      examples: group.examples.map((ex): IntegrationExample => {
        const { variants: rawVariants, ...rest } = ex;
        if (rawVariants) {
          const variants: Record<string, ResolvedVariant> = {};
          for (const [variantId, v] of Object.entries(rawVariants)) {
            variants[variantId] = { ...v, code: sourceFor(v.sourcePath) };
          }
          return { ...rest, variants };
        }
        return { ...rest, code: sourceFor(ex.sourcePath) };
      }),
    };
  },
);

export const tocSections: TocSection[] = metadataTocSections;
