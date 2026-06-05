import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./theme/globals.scss";

import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { mantineTheme } from "./theme/mantineTheme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={mantineTheme} defaultColorScheme="auto">
      <DatesProvider settings={{ locale: "en-gb" }}>
        <Notifications position="top-right" />
        <App />
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
