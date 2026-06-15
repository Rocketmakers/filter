import { useEffect, useState } from "react";

/**
 * Observes a set of section ids and returns whichever is currently the
 * "active" one (topmost section whose heading is in the upper band of
 * the viewport). Same heuristic Next.js / Vercel docs use.
 */
export function useScrollSpy(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const visible = new Set<string>();
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const pickActive = () => {
      // Active = first id in document order that is currently intersecting.
      for (const id of ids) {
        if (visible.has(id)) {
          setActive(id);
          return;
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        pickActive();
      },
      // Highlight whichever heading sits roughly in the top quarter of the
      // viewport. The bottom inset keeps the active link from flipping the
      // moment a heading scrolls past centre.
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
