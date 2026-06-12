import { ArrowUpIcon, ExternalLinkIcon } from "lucide-react";

import { cn } from "@/lib/class-names";

import { CopyPromptButton } from "./copy-prompt-button";
import { tocSections } from "./examples";
import { useScrollSpy } from "./use-scroll-spy";

import styles from "./integrations.module.scss";

const EDIT_URL =
  "https://github.com/Rocketmakers/filter-builder/edit/main/packages/mantine/src/App.tsx";

// Stack identifier for the copy-prompt button. Codemod swaps this per package
// (mantine → stylex → tailwind-shadcn) when propagating across the trio.
const STACK = "mantine" as const;

export function OnThisPage() {
  const ids = tocSections.map((s) => s.id);
  const active = useScrollSpy(ids);

  return (
    <div className={styles.tocCol}>
      <div className={styles.copyPromptSection}>
        <CopyPromptButton stack={STACK} />
      </div>
      <div className={styles.tocLabel}>On this page</div>
      <div className={styles.tocWrapper}>
        <div aria-hidden className={styles.tocFadeTop} />
        <div aria-hidden className={styles.tocFadeBottom} />
        <ul className={styles.tocList}>
          {tocSections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "location" : undefined}
                className={cn(
                  styles.tocLink,
                  s.depth === 2 && styles.tocLinkDepth2,
                  active === s.id && styles.tocLinkActive,
                )}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.tocFooter}>
        <a
          className={styles.tocFooterLink}
          href={EDIT_URL}
          target="_blank"
          rel="noreferrer noopener"
        >
          Edit this page on GitHub <ExternalLinkIcon size={12} />
        </a>
        <button
          type="button"
          className={styles.tocFooterLink}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Scroll to top <ArrowUpIcon size={12} />
        </button>
      </div>
    </div>
  );
}
