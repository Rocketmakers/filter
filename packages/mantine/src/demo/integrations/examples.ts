import {
  integrationGroups as metadataGroups,
  tocSections as metadataTocSections,
  type ExampleVariant as MetadataVariant,
  type IntegrationExample as Metadata,
  type IntegrationGroup as MetadataGroup,
  type QuestionGroup,
  type TocSection,
} from "@filter-builder/demo-code";

import drizzleSource from "@filter-builder/demo-code/integrations/examples/drizzle.ts?raw";
import elasticsearchSource from "@filter-builder/demo-code/integrations/examples/elasticsearch.ts?raw";
import inMemorySource from "@filter-builder/demo-code/integrations/examples/in-memory.tsx?raw";
import kyselySource from "@filter-builder/demo-code/integrations/examples/kysely.ts?raw";
import mongooseSource from "@filter-builder/demo-code/integrations/examples/mongoose.ts?raw";
import prismaSource from "@filter-builder/demo-code/integrations/examples/prisma.ts?raw";
import rawSqlSource from "@filter-builder/demo-code/integrations/examples/raw-sql.ts?raw";
import axiosGraphqlStateSource from "@filter-builder/demo-code/integrations/examples/send-to-api/axios-graphql-state.tsx?raw";
import axiosGraphqlUrlSource from "@filter-builder/demo-code/integrations/examples/send-to-api/axios-graphql-url.tsx?raw";
import axiosRestStateSource from "@filter-builder/demo-code/integrations/examples/send-to-api/axios-rest-state.tsx?raw";
import axiosRestUrlSource from "@filter-builder/demo-code/integrations/examples/send-to-api/axios-rest-url.tsx?raw";
import tanstackQueryGraphqlStateSource from "@filter-builder/demo-code/integrations/examples/send-to-api/tanstack-query-graphql-state.tsx?raw";
import tanstackQueryGraphqlUrlSource from "@filter-builder/demo-code/integrations/examples/send-to-api/tanstack-query-graphql-url.tsx?raw";
import tanstackQueryRestStateSource from "@filter-builder/demo-code/integrations/examples/send-to-api/tanstack-query-rest-state.tsx?raw";
import tanstackQueryRestUrlSource from "@filter-builder/demo-code/integrations/examples/send-to-api/tanstack-query-rest-url.tsx?raw";
import vanillaFetchGraphqlStateSource from "@filter-builder/demo-code/integrations/examples/send-to-api/vanilla-fetch-graphql-state.tsx?raw";
import vanillaFetchGraphqlUrlSource from "@filter-builder/demo-code/integrations/examples/send-to-api/vanilla-fetch-graphql-url.tsx?raw";
import vanillaFetchRestStateSource from "@filter-builder/demo-code/integrations/examples/send-to-api/vanilla-fetch-rest-state.tsx?raw";
import vanillaFetchRestUrlSource from "@filter-builder/demo-code/integrations/examples/send-to-api/vanilla-fetch-rest-url.tsx?raw";
import stateMobxSource from "@filter-builder/demo-code/integrations/examples/state/mobx.tsx?raw";
import stateReactContextSource from "@filter-builder/demo-code/integrations/examples/state/react-context.tsx?raw";
import stateReduxSource from "@filter-builder/demo-code/integrations/examples/state/redux-toolkit.tsx?raw";
import stateZustandSource from "@filter-builder/demo-code/integrations/examples/state/zustand.tsx?raw";
import urlNextAppSource from "@filter-builder/demo-code/integrations/examples/url/next-app-router.tsx?raw";
import urlNextPagesSource from "@filter-builder/demo-code/integrations/examples/url/next-pages-router.ts?raw";
import urlReactRouterSource from "@filter-builder/demo-code/integrations/examples/url/react-router.ts?raw";
import urlTanstackSource from "@filter-builder/demo-code/integrations/examples/url/tanstack.tsx?raw";
import urlVanillaSource from "@filter-builder/demo-code/integrations/examples/url/vanilla.ts?raw";

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

const sourcesByPath: Record<string, string> = {
  "@filter-builder/demo-code/integrations/examples/url/vanilla.ts":
    urlVanillaSource,
  "@filter-builder/demo-code/integrations/examples/url/next-app-router.tsx":
    urlNextAppSource,
  "@filter-builder/demo-code/integrations/examples/url/next-pages-router.ts":
    urlNextPagesSource,
  "@filter-builder/demo-code/integrations/examples/url/tanstack.tsx":
    urlTanstackSource,
  "@filter-builder/demo-code/integrations/examples/url/react-router.ts":
    urlReactRouterSource,
  "@filter-builder/demo-code/integrations/examples/state/react-context.tsx":
    stateReactContextSource,
  "@filter-builder/demo-code/integrations/examples/state/zustand.tsx":
    stateZustandSource,
  "@filter-builder/demo-code/integrations/examples/state/redux-toolkit.tsx":
    stateReduxSource,
  "@filter-builder/demo-code/integrations/examples/state/mobx.tsx":
    stateMobxSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/vanilla-fetch-rest-url.tsx":
    vanillaFetchRestUrlSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/vanilla-fetch-rest-state.tsx":
    vanillaFetchRestStateSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/vanilla-fetch-graphql-url.tsx":
    vanillaFetchGraphqlUrlSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/vanilla-fetch-graphql-state.tsx":
    vanillaFetchGraphqlStateSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/tanstack-query-rest-url.tsx":
    tanstackQueryRestUrlSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/tanstack-query-rest-state.tsx":
    tanstackQueryRestStateSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/tanstack-query-graphql-url.tsx":
    tanstackQueryGraphqlUrlSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/tanstack-query-graphql-state.tsx":
    tanstackQueryGraphqlStateSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/axios-rest-url.tsx":
    axiosRestUrlSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/axios-rest-state.tsx":
    axiosRestStateSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/axios-graphql-url.tsx":
    axiosGraphqlUrlSource,
  "@filter-builder/demo-code/integrations/examples/send-to-api/axios-graphql-state.tsx":
    axiosGraphqlStateSource,
  "@filter-builder/demo-code/integrations/examples/raw-sql.ts": rawSqlSource,
  "@filter-builder/demo-code/integrations/examples/drizzle.ts": drizzleSource,
  "@filter-builder/demo-code/integrations/examples/kysely.ts": kyselySource,
  "@filter-builder/demo-code/integrations/examples/prisma.ts": prismaSource,
  "@filter-builder/demo-code/integrations/examples/mongoose.ts": mongooseSource,
  "@filter-builder/demo-code/integrations/examples/elasticsearch.ts":
    elasticsearchSource,
  "@filter-builder/demo-code/integrations/examples/in-memory.tsx":
    inMemorySource,
};

const sourceFor = (path: string | undefined) =>
  path ? (sourcesByPath[path] ?? "") : "";

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
