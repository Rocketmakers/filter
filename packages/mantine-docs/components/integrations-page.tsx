"use client";

import { BackendIntegrations } from "./integrations";
import { CopyPromptButton } from "./integrations/copy-prompt-button";
import { IntegrationsStateProvider } from "./integrations/state";

import styles from "./integrations-page.module.scss";

export function IntegrationsPage() {
  return (
    <IntegrationsStateProvider>
      <div className={styles.root}>
        <BackendIntegrations />
        <div className={styles.copyPromptDock}>
          <div className={styles.copyPromptDockInner}>
            <CopyPromptButton stack="mantine" />
          </div>
        </div>
      </div>
    </IntegrationsStateProvider>
  );
}
