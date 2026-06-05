# @rocketmakers/filter

One-shot installer for the [`filter-builder`](https://github.com/Rocketmakers/filter)
compound component — Mantine and StyleX variants.

```sh
npx @rocketmakers/filter mantine
# or
npx @rocketmakers/filter stylex
```

The CLI fetches the matching registry manifest from
`https://rocketmakers.github.io/filter/r/`, writes the source files into
`<your-project>/src/`, and installs the runtime + dev npm dependencies with
whichever package manager your project uses (pnpm / yarn / bun / npm).

## Options

| Flag | Effect |
| --- | --- |
| `--cwd <dir>` | Target project directory (default: current directory) |
| `--no-install` | Skip dependency install; print the package lists instead |
| `--force` | Overwrite existing files without prompting |
| `--help`, `-h` | Show usage |

## What it writes

Everything listed under `files` in the variant's manifest:

- `filter-builder-mantine.json` — Mantine v8 + SCSS modules
- `filter-builder-stylex.json` — StyleX + Radix + cmdk

Manifests live at `https://rocketmakers.github.io/filter/r/<name>.json`. Each
includes inlined file contents, so the CLI runs offline once the manifest is
fetched.

## Tailwind variant

Tailwind users skip this CLI and install via the shadcn registry directly:

```sh
npx shadcn@latest add https://rocketmakers.github.io/filter/r/filter-builder-tailwind.json
```

## Environment

- `FILTER_CLI_REGISTRY_BASE` — override the manifest base URL (useful for
  forks or local testing against a private mirror).
