# filter-builder

Three flavours of the same compound `FilterBuilder` component, each in its own
package. All shadcn-style: copy the source into your app, no library dep.

| Package | Styling stack | Port | Dir |
| --- | --- | --- | --- |
| `@filter-builder/tailwind` | Tailwind v4 + Radix + cmdk | 5173 | [`packages/tailwind`](packages/tailwind) |
| `@filter-builder/mantine` | Mantine v8 + SCSS modules | 5174 | [`packages/mantine`](packages/mantine) |
| `@filter-builder/stylex` | StyleX + Radix + cmdk | 5175 | [`packages/stylex`](packages/stylex) |

Each variant supports six filter types (`text`, `number`, `boolean`, `select`,
`date`, `dateTime`), natural-language date parsing, async option search,
multi-select with auto-condition switching, lockable pills, and a client-side
`useFilteredRows` helper.

## Run everything

```sh
pnpm install
pnpm dev
```

Opens all three demos in parallel on 5173 / 5174 / 5175.

## Run one

```sh
pnpm dev:tw       # tailwind on 5173
pnpm dev:mantine  # mantine on 5174
pnpm dev:stylex   # stylex on 5175
```

## Light / dark

Every demo has a light/dark toggle in the header so you can verify the dark
theme path. The Tailwind variant uses shadcn's CSS-variable approach, Mantine
uses `MantineProvider colorScheme`, StyleX uses `stylex.createTheme`.

## Distribution

This repo is structured so each package can be served as a shadcn-style
registry later (flat `src/components/ui/` + `components.json`), but no
registry is published yet. For now, copy the folder you want into your app.

## AI codemod (cross-package sync)

The three packages drift apart easily because they share a public API but
diverge in styling stack. To keep them in sync, an AI codemod lives in
[`.robo-codemod/`](.robo-codemod). When you change one package, it proposes the
equivalent updates to the other two.

### How it triggers

- **Manual**: `pnpm codemod` — looks at staged changes first, falls back to
  unstaged.
- **Pre-commit hook** ([.husky/pre-commit](.husky/pre-commit)) — **prompts you
  on every commit** (`Run cross-package codemod against staged diff? [y/N]`).
  Press `y` to run, anything else (including plain Enter) to skip. The codemod
  itself still only triggers when **exactly one** of the three packages has
  staged changes (to avoid re-syncing during a multi-package commit). Output
  files are left **unstaged** for you to review with `git diff` and stage in a
  follow-up commit. Set `CODEMOD_AUTO=1` to always run without prompting (e.g.
  in CI), or `CODEMOD_SKIP=1` to silence the prompt entirely for one commit.

### Picking an AI provider

The codemod supports the same providers as
[robo-commitizen](../robo-commitizen): Claude CLI, OpenAI, Gemini, OpenRouter.
Set the provider once and skip the prompt:

```bash
export CODEMOD_PROVIDER=claude-cli    # no key needed; uses the local `claude` binary
# or
export CODEMOD_PROVIDER=openai && export OPENAI_API_KEY=sk-...
export CODEMOD_PROVIDER=gemini && export GEMINI_API_KEY=...
export CODEMOD_PROVIDER=openrouter && export OPENROUTER_API_KEY=...
```

Override the auto-selected models if you want:

```bash
export CODEMOD_SMALL_MODEL=sonnet
export CODEMOD_BIG_MODEL=opus
```

The codemod also honours the existing `CZ_AI_*` vars as a fallback, so a repo
that already uses robo-commitizen for commits gets the codemod for free.

### Other useful env vars

- `CODEMOD_AUTO=1` — skip every prompt and apply the AI suggestion without
  confirmation. Use in CI or when you really trust the model.
- `CODEMOD_SKIP=1` — bail out immediately. Useful as a per-command escape
  hatch: `CODEMOD_SKIP=1 git commit -m "..."`.
- `CODEMOD_SOURCE=tailwind` — force a specific source package even if multiple
  packages are staged.

You can also bypass the hook entirely with `git commit --no-verify`.

### Customising the package map

Edit [`.codemod-config.cjs`](.codemod-config.cjs) to change the package
roster, styling-stack descriptions, or which subpaths inside each package the
codemod watches.

### What it owns

The `.robo-codemod/` folder is **your code**, shadcn-style — modify it freely.
It does not pull a runtime dependency, just calls the AI provider's HTTP API
(or spawns `claude -p` for Claude CLI).
