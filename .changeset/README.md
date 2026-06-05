# Changesets

Drop a markdown file in this folder describing what you changed and the bump
type — `pnpm changeset` generates one for you interactively.

When your PR merges to `main`, the release workflow opens (or updates) a
**Version Packages** PR that rolls every pending changeset into a version
bump + CHANGELOG entry. Merging that PR tags the repo, publishes a GitHub
Release, and redeploys the shadcn registry to GitHub Pages.

The three variant packages (`@filter-builder/tailwind`, `…/mantine`,
`…/stylex`) are versioned in lockstep via the `fixed` group in
`config.json` — one bump moves all three.

This repo doesn't publish to npm; `privatePackages.version: true` makes
changesets version private packages anyway so the registry payload carries
a real version string.
