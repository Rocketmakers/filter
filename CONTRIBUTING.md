# Contributing

Workflow notes for working inside this repo. Consumers who just want to use
`FilterBuilder` should read [README.md](README.md) instead.

## AI commits (robo-commitizen)

Plain `git commit` (no `-m`) routes through an AI-assisted Conventional Commit
flow via [`robo-commitizen`](https://www.npmjs.com/package/robo-commitizen).
The adapter and templates live in [`.robo-cz/`](.robo-cz), the prompts are
configured in [`.commit-config.cjs`](.commit-config.cjs), and the husky hook
that wires it in is [`.husky/prepare-commit-msg`](.husky/prepare-commit-msg).

```sh
git add .
git commit                    # opens cz-ai → AI suggests a conventional commit,
                              # you confirm or edit, commit lands
git commit -m "feat: ..."     # bypasses cz-ai (any explicit message does)
git commit --no-verify        # bypasses both cz-ai and the codemod prompt
```

Provider selection happens on first run and is remembered. To pin it up front:

```sh
export CZ_AI_PROVIDER=claude-cli      # no key needed; uses the local `claude` binary
# or
export CZ_AI_PROVIDER=openai     && export OPENAI_API_KEY=sk-...
export CZ_AI_PROVIDER=gemini     && export GEMINI_API_KEY=...
export CZ_AI_PROVIDER=openrouter && export OPENROUTER_API_KEY=...
```

Override models if you want: `CZ_AI_SMALL_MODEL=haiku`, `CZ_AI_BIG_MODEL=sonnet`.
Set `CZ_AI_SKIP=1` to skip cz-ai for one commit without skipping anything else.

## AI codemod (cross-package sync)

The three packages drift apart easily because they share a public API but
diverge in styling stack. To keep them in sync, an AI codemod lives in
[`.robo-codemod/`](.robo-codemod). When you change one package, it proposes the
equivalent updates to the other two.

### How it triggers

- **Manual**: `pnpm codemod` — looks at staged changes first, falls back to
  unstaged.
- **Pre-commit hook** ([`.husky/pre-commit`](.husky/pre-commit)) — **prompts you
  on every commit** (`Run cross-package codemod against staged diff? [y/N]`).
  Press `y` to run, anything else (including plain Enter) to skip. The codemod
  itself still only triggers when **exactly one** of the three packages has
  staged changes (to avoid re-syncing during a multi-package commit). Output
  files are left **unstaged** for you to review with `git diff` and stage in a
  follow-up commit. Set `CODEMOD_AUTO=1` to always run without prompting (e.g.
  in CI), or `CODEMOD_SKIP=1` to silence the prompt entirely for one commit.

### Picking an AI provider

The codemod supports the same providers as robo-commitizen: Claude CLI, OpenAI,
Gemini, OpenRouter. Set the provider once and skip the prompt:

```sh
export CODEMOD_PROVIDER=claude-cli    # no key needed; uses the local `claude` binary
# or
export CODEMOD_PROVIDER=openai && export OPENAI_API_KEY=sk-...
export CODEMOD_PROVIDER=gemini && export GEMINI_API_KEY=...
export CODEMOD_PROVIDER=openrouter && export OPENROUTER_API_KEY=...
```

Override the auto-selected models if you want:

```sh
export CODEMOD_SMALL_MODEL=sonnet
export CODEMOD_BIG_MODEL=opus
```

The codemod also honours the existing `CZ_AI_*` vars as a fallback, so the
cz-ai setup above already covers this — you only need a separate
`CODEMOD_PROVIDER` if you want to differ.

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

## Releases

Distribution is a shadcn registry hosted on GitHub Pages — not npm. The
release flow uses [Changesets](https://github.com/changesets/changesets) for
versioning and CHANGELOG generation, and GitHub Actions for everything else.

### What you do as a contributor

Nothing, in the happy path. Open a PR with [Conventional Commit](https://www.conventionalcommits.org/)
subjects (cz-ai already produces these) and the
[`auto-changeset`](.github/workflows/auto-changeset.yml) workflow generates
and commits a `.changeset/auto-pr-<N>.md` to your branch on every push.

Bump level is inferred from the commits between your branch and `main`:

| Commit shape | Bump |
| --- | --- |
| `feat!: …` or any commit body with `BREAKING CHANGE:` | major |
| `feat: …` | minor |
| `fix: …`, `perf: …` | patch |
| `docs:`, `chore:`, `style:`, `test:`, `ci:`, `build:`, `refactor:`, anything else | none (no changeset) |

The highest bump across all commits on the branch wins, and the changeset
summary is the concatenated list of qualifying commit subjects — which
becomes the `CHANGELOG.md` entry verbatim.

### Overriding the bot

If the auto-inference is wrong (e.g. you want to ship a `refactor:` as a
minor for some reason, or rewrite the changelog note), drop your own
changeset:

```sh
pnpm changeset
```

The bot **only writes when no other `.changeset/*.md` exists** for the PR.
A manual changeset shuts it up.

### PRs from forks

The auto-changeset workflow no-ops on forked PRs — the default
`GITHUB_TOKEN` can't push back to a fork branch. Fork contributors should
run `pnpm changeset` locally and commit the result, or a maintainer can add
one before merge.

### Non-shipping PRs

Pure docs / CI / `.robo-*/` changes won't trigger a changeset (no
qualifying commit types). They'll merge without opening a release PR,
which is correct — they shouldn't ship a version.

### What happens after merge to `main`

[`.github/workflows/release.yml`](.github/workflows/release.yml) runs on every
push to `main`:

1. **`changesets/action`** consumes any pending `.changeset/*.md` files. If
   there are any, it opens (or updates) a **"chore: release"** PR that bumps
   `version` in the three package.jsons and rewrites `CHANGELOG.md`. Nothing
   is published yet.
2. **Merging that release PR** triggers the workflow again. This time
   `changesets/action` sees no pending changesets but a fresh version, so it
   tags the commit (`v1.2.3`), creates a GitHub Release with the changelog,
   and sets `published=true`.
3. **`deploy-registry`** then runs `pnpm build:registry` and publishes the
   `registry-dist/` JSON files to GitHub Pages. The URLs in [README.md](README.md)
   are now serving the new version.

CI on PRs ([`ci.yml`](.github/workflows/ci.yml)) lints, builds the packages,
and builds the registry — so a broken `registry.json` blocks the PR before it
can reach `main`.

### One-time GitHub setup

For the workflows to work, the repo needs (in **Settings → Actions → General**):

- "Workflow permissions" set to **Read and write**
- "Allow GitHub Actions to create and approve pull requests" **enabled**

And in **Settings → Pages**, set the source to **GitHub Actions** (not a branch).

No npm token is needed — we don't publish to npm.

### Touching the registry manifest

If you add or rename a file inside `packages/*/src/components/ui/filter-builder/`,
update [`registry.json`](registry.json) at the repo root in the same PR. CI
runs `pnpm build:registry`, which will fail if a referenced path no longer
exists — so you'll catch this before merge regardless.
