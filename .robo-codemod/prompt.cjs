/* eslint-disable */
"use strict";

const { existsSync, readFileSync } = require("fs");
const { resolve, join } = require("path");

const {
  MAX_FILE_CHARS,
  PACKAGE_ROOTS,
  PACKAGE_STACKS,
  SYNC_PATHS,
} = require("./shared.cjs");
const { relativeToPackageSync } = require("./detect.cjs");

const REPO_ROOT = resolve(__dirname, "..");

const readFile = (relativePath) => {
  const fullPath = join(REPO_ROOT, relativePath);
  if (!existsSync(fullPath)) {
    return null;
  }
  try {
    return readFileSync(fullPath, "utf-8");
  } catch {
    return null;
  }
};

const truncateContent = (content, maxChars = MAX_FILE_CHARS) => {
  if (typeof content !== "string") {
    return "";
  }
  if (content.length <= maxChars) {
    return content;
  }
  const lineEnd = content.lastIndexOf("\n", maxChars);
  return `${content.slice(0, lineEnd > 0 ? lineEnd : maxChars)}\n\n// ... (truncated for brevity)`;
};

const buildSourceFileBlock = (file) => {
  const content = readFile(file);
  if (content == null) {
    return `### ${file}\n\n(file does not exist or unreadable)\n`;
  }
  return `### ${file}\n\n\`\`\`\n${truncateContent(content)}\n\`\`\`\n`;
};

const buildTargetFileBlock = (packageName, file) => {
  const content = readFile(file);
  if (content == null) {
    return `### ${packageName}: ${file}\n\n(file does not exist yet — codemod may need to create it)\n`;
  }
  return `### ${packageName}: ${file}\n\n\`\`\`\n${truncateContent(content)}\n\`\`\`\n`;
};

const buildEquivalentTargetPaths = (sourcePackage, sourceFiles, targetPackages) => {
  const result = {};
  for (const target of targetPackages) {
    const targetRoot = PACKAGE_ROOTS[target];
    const paths = [];
    for (const sourceFile of sourceFiles) {
      const rel = relativeToPackageSync(sourceFile, sourcePackage);
      if (rel) {
        paths.push(`${targetRoot}/${rel}`);
      }
    }
    result[target] = paths;
  }
  return result;
};

const buildPrompt = ({
  sourcePackage,
  targetPackages,
  sourceFiles,
  sourceStat,
  sourceDiff,
  motivation,
}) => {
  const sourceStack = PACKAGE_STACKS[sourcePackage] || sourcePackage;
  const targetSummaries = targetPackages
    .map(
      (target) =>
        `- ${target} (${PACKAGE_STACKS[target] || target}) — root: ${PACKAGE_ROOTS[target]}`,
    )
    .join("\n");

  const sourceFileBlocks = sourceFiles
    .map((file) => buildSourceFileBlock(file))
    .join("\n");

  const equivalentTargetPaths = buildEquivalentTargetPaths(
    sourcePackage,
    sourceFiles,
    targetPackages,
  );

  const targetCurrentStateBlocks = targetPackages
    .map((target) => {
      const blocks = equivalentTargetPaths[target]
        .map((file) => buildTargetFileBlock(target, file))
        .join("\n");
      return `## Current state of ${target} (equivalent files)\n\n${blocks}`;
    })
    .join("\n\n");

  const allowedPathsBlock = targetPackages
    .map((target) => {
      const paths = equivalentTargetPaths[target].length
        ? equivalentTargetPaths[target]
        : [`${PACKAGE_ROOTS[target]}/${SYNC_PATHS[0] || ""}`];
      return `- ${target}: ${paths.join(", ")}`;
    })
    .join("\n");

  return `You are an AI code mod that propagates changes across three sibling packages of the same React component library.

The three packages implement the same compound \`FilterBuilder\` component, each with a different styling stack:
${targetPackages.map((t) => `- ${t}: ${PACKAGE_STACKS[t]}`).join("\n")}
- ${sourcePackage}: ${sourceStack}   <-- SOURCE (just changed)

TASK:
The developer just changed files in the \`${sourcePackage}\` package. Update the equivalent files in the OTHER packages (${targetPackages.join(", ")}) so they have the same feature / fix / behaviour, but expressed in each target's idiomatic styling stack.

RULES:
1. Only modify files in target packages: ${targetPackages.join(", ")}. Never modify ${sourcePackage} files.
2. Preserve each target's styling idioms:
   - Tailwind: utility class strings, \`cn()\` helper, shadcn-style components.
   - Mantine: Mantine v8 components (\`Button\`, \`TextInput\`, etc.) + SCSS modules (\`.module.scss\`). Do NOT introduce Tailwind classes or Radix primitives in mantine files.
   - StyleX: \`stylex.create\` / \`stylex.props\`, Radix primitives, cmdk. Do NOT introduce Tailwind classes or SCSS modules.
3. Keep the public API (component props, exported types) identical across packages.
4. If a change is purely cosmetic to the source styling and has no equivalent in a target (e.g., changing a Tailwind class with no logic impact), leave the target unchanged.
5. If no propagation is needed (typo fix in a comment, package-local file, etc.), return changes: [].
6. For each file you write, output the FULL final content of that file (not a diff).
7. Output paths MUST be one of these allowed locations:
${allowedPathsBlock}
8. If you need to create a NEW file in a target (because the source added a new file), use the equivalent path under the target's package root.

TARGET PACKAGE STACKS:
${targetSummaries}

SOURCE PACKAGE (${sourcePackage}) DIFF STAT:
${sourceStat}

SOURCE PACKAGE (${sourcePackage}) DIFF:
${sourceDiff}

## Current state of ${sourcePackage} (the source-of-truth files after the change)

${sourceFileBlocks}

${targetCurrentStateBlocks}
${motivation ? `\nDEVELOPER'S MOTIVATION / CONTEXT:\n${motivation}\n` : ""}
Respond with ONLY valid JSON matching the schema:
{
  "summary": "1-sentence summary of what propagated",
  "rationale": "2-4 sentences explaining the cross-package mapping decisions",
  "changes": [
    { "package": "<target>", "path": "<full repo path>", "action": "write" | "delete", "content": "<full file content or empty for delete>" }
  ]
}`;
};

const parseJsonResponse = (text) => {
  const raw = typeof text === "string" ? text : String(text);

  try {
    return JSON.parse(raw);
  } catch {
    const fenceMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1]);
      } catch {
        // fall through to brace match
      }
    }
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Could not parse AI response: ${raw.slice(0, 200)}`);
    }
    return JSON.parse(match[0]);
  }
};

module.exports = {
  buildPrompt,
  parseJsonResponse,
};
