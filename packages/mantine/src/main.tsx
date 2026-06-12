import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/code-highlight/styles.css";
import "highlight.js/styles/atom-one-dark.css";
import "./theme/globals.scss";

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
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { mantineTheme } from "./theme/mantineTheme";

hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("graphql", graphql);

const codeHighlightAdapter = createHighlightJsAdapter(hljs);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={mantineTheme} defaultColorScheme="auto">
      <CodeHighlightAdapterProvider adapter={codeHighlightAdapter}>
        <DatesProvider settings={{ locale: "en-gb" }}>
          <Notifications position="top-right" />
          <App />
        </DatesProvider>
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  </StrictMode>,
);
