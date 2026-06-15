import { Tooltip } from "@mantine/core";
import { CheckIcon, ClipboardIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/class-names";

import { buildPrompt, type Stack } from "./build-prompt";
import { getLogo } from "./logos";
import { useIntegrationsState } from "./state";

import styles from "./integrations.module.scss";

const COPIED_RESET_MS = 2000;

export function CopyPromptButton({ stack }: { stack: Stack }) {
  const { wizardState, selectedExamples, perTileToggles } =
    useIntegrationsState();
  const { ready, missing, picks, markdown } = buildPrompt(
    stack,
    wizardState,
    selectedExamples,
    perTileToggles,
  );

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
    } catch {
      // Fallback for permission errors / non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = markdown;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
    }
  };

  const tooltipLabel = ready ? (
    "Copy a markdown LLM prompt with your picks and matching source code."
  ) : (
    <div className={styles.copyPromptTooltipBody}>
      <div className={styles.copyPromptTooltipTitle}>
        Pick the following to enable:
      </div>
      <ul className={styles.copyPromptTooltipList}>
        {missing.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <Tooltip
      label={tooltipLabel}
      withArrow
      position="left"
      multiline
      w={240}
      openDelay={ready ? 300 : 0}
    >
      <button
        type="button"
        className={cn(
          styles.copyPromptItem,
          !ready && styles.copyPromptItemDisabled,
        )}
        // Keep pointer-events on so the tooltip works while "disabled".
        // We block the action manually in handleCopy.
        aria-disabled={!ready}
        onClick={handleCopy}
      >
        {/* Icon strip sits above the label and always reserves vertical
            space, so the row height doesn't change when picks first appear. */}
        <span className={styles.copyPromptIconStrip} aria-hidden>
          {picks.map((p, i) => (
            <span
              key={`${p.logoKey}-${i}`}
              className={styles.copyPromptIcon}
            >
              {getLogo(p.logoKey)}
            </span>
          ))}
        </span>
        <span className={styles.copyPromptItemLabel}>
          {copied ? (
            <>
              Copied! <CheckIcon size={12} />
            </>
          ) : (
            <>
              Copy as markdown prompt <ClipboardIcon size={12} />
            </>
          )}
        </span>
      </button>
    </Tooltip>
  );
}
