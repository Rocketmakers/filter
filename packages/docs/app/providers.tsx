"use client";

import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from "@mantine/code-highlight";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import hljs from "highlight.js/lib/core";
import graphql from "highlight.js/lib/languages/graphql";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";

import { mantineTheme } from "@filter-builder/mantine/theme";

hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("graphql", graphql);

const codeHighlightAdapter = createHighlightJsAdapter(hljs);

export function MantineRoot({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const forceColorScheme =
    resolvedTheme === "dark" || resolvedTheme === "light"
      ? resolvedTheme
      : undefined;

  return (
    <MantineProvider
      theme={mantineTheme}
      defaultColorScheme="auto"
      forceColorScheme={forceColorScheme}
    >
      <CodeHighlightAdapterProvider adapter={codeHighlightAdapter}>
        <DatesProvider settings={{ locale: "en-gb" }}>
          <Notifications position="top-right" />
          {children}
        </DatesProvider>
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  );
}
