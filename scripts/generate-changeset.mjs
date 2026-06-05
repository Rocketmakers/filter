#!/usr/bin/env node
/**
 * Reads commits on the current branch since main, infers a changeset bump
 * level from Conventional Commit subjects, and writes a single auto-managed
 * `.changeset/auto-pr-<N>.md` file. Idempotent: re-running on an updated PR
 * overwrites the same file rather than creating duplicates.
 *
 * Bump mapping (highest wins across commits):
 *   feat!: / BREAKING CHANGE: → major
 *   feat:                     → minor
 *   fix:, perf:               → patch
 *   anything else             → skip (no changeset)
 *
 * Skips entirely if a manual `.changeset/*.md` already exists (other than the
 * one this script owns) — we never overwrite human-authored changesets.
 *
 * Env (all required when invoked from the workflow):
 *   BASE_REF   — PR base ref, e.g. "main"
 *   PR_NUMBER  — used for the auto-changeset filename
 */
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE_REF = process.env.BASE_REF || "main";
const PR_NUMBER = process.env.PR_NUMBER;
if (!PR_NUMBER) {
  console.error("PR_NUMBER env var is required");
  process.exit(1);
}

const AUTO_FILENAME = `auto-pr-${PR_NUMBER}.md`;
const CHANGESET_DIR = ".changeset";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

// 1. Bail out if a human-authored changeset already exists for this PR.
mkdirSync(CHANGESET_DIR, { recursive: true });
const existing = readdirSync(CHANGESET_DIR).filter(
  (f) => f.endsWith(".md") && f !== "README.md" && f !== AUTO_FILENAME,
);
if (existing.length > 0) {
  console.log(
    `Manual changeset(s) present (${existing.join(", ")}) — leaving them alone.`,
  );
  process.exit(0);
}

// 2. Grab commit subjects since the merge-base with the PR base branch.
sh(`git fetch --no-tags origin ${BASE_REF}`);
const mergeBase = sh(`git merge-base HEAD origin/${BASE_REF}`);
const log = sh(`git log ${mergeBase}..HEAD --pretty=format:%H%x09%s%x09%b%x1e`);
if (!log) {
  console.log("No commits since base — nothing to generate.");
  process.exit(0);
}

const commits = log
  .split("\x1e")
  .map((c) => c.trim())
  .filter(Boolean)
  .map((c) => {
    const [hash, subject, ...bodyParts] = c.split("\t");
    return { hash, subject: subject || "", body: bodyParts.join("\t") };
  });

// 3. Conventional commit parser. Matches `type(scope)!: subject`.
const RE = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s*(?<rest>.+)$/i;
const BUMP_RANK = { major: 3, minor: 2, patch: 1, none: 0 };
let bump = "none";
const notes = [];

for (const { subject, body } of commits) {
  const m = subject.match(RE);
  if (!m) continue;
  const type = m.groups.type.toLowerCase();
  const bang = !!m.groups.bang;
  const breaking = bang || /^BREAKING CHANGE:/m.test(body);
  let level = "none";
  if (breaking) level = "major";
  else if (type === "feat") level = "minor";
  else if (type === "fix" || type === "perf") level = "patch";
  if (BUMP_RANK[level] > BUMP_RANK[bump]) bump = level;
  if (level !== "none") notes.push(`- ${subject}`);
}

if (bump === "none") {
  console.log("No shipping commits (feat/fix/perf/breaking) — no changeset.");
  process.exit(0);
}

// 4. Find which workspace packages changed in the diff. Only non-private
//    packages need a frontmatter entry; with the `fixed` group, declaring one
//    is enough to bump all three, but declaring each is more explicit and
//    survives the fixed-group being removed later.
const changedFiles = sh(`git diff --name-only ${mergeBase}..HEAD`).split("\n");
const packagesRoot = "packages";
const candidates = readdirSync(packagesRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

const changedPackages = candidates.filter((name) =>
  changedFiles.some((f) => f.startsWith(`${packagesRoot}/${name}/`)),
);

if (changedPackages.length === 0) {
  console.log("No package files touched — skipping changeset.");
  process.exit(0);
}

const packageNames = changedPackages
  .map((dir) => {
    const pkg = JSON.parse(
      readFileSync(join(packagesRoot, dir, "package.json"), "utf8"),
    );
    return pkg.name;
  })
  .filter(Boolean);

// 5. Write the changeset file.
const frontmatter = packageNames.map((n) => `"${n}": ${bump}`).join("\n");
const summary = notes.join("\n");
const content = `---\n${frontmatter}\n---\n\n${summary}\n`;

const outPath = join(CHANGESET_DIR, AUTO_FILENAME);
writeFileSync(outPath, content);
console.log(`Wrote ${outPath}\n\n${content}`);
