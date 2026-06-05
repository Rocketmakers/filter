/**
 * Config for the AI codemod that propagates changes across sibling packages.
 * Used by .robo-codemod/* runtime.
 */
module.exports = {
  packages: [
    {
      name: "tailwind",
      root: "packages/tailwind",
      stack: "Tailwind v4 + Radix + cmdk + shadcn-style components",
    },
    {
      name: "mantine",
      root: "packages/mantine",
      stack: "Mantine v8 + SCSS modules (.module.scss)",
    },
    {
      name: "stylex",
      root: "packages/stylex",
      stack: "StyleX + Radix + cmdk",
    },
  ],
  syncPaths: ["src/components/ui/filter-builder"],
};
