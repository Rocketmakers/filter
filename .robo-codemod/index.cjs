/* eslint-disable */
/* eslint-disable no-console */
"use strict";

const { PACKAGE_NAMES } = require("./shared.cjs");
const {
  detectSyncableChange,
  getStagedDiffForFiles,
  getStagedFiles,
  getStagedStatForFiles,
  getUnstagedFiles,
} = require("./detect.cjs");
const { buildPrompt } = require("./prompt.cjs");
const { applyChanges, validateChanges } = require("./apply.cjs");
const {
  getCodemodSuggestion,
  getExecutionModelLabel,
  resolveExecutionModel,
} = require("./ai.cjs");
const { createProgressRenderer } = require("../.robo-shared/ai.cjs");
const {
  ensureModelReady,
  previewAndConfirm,
  promptText,
  selectModel,
} = require("./prompt-flow.cjs");
const { resolveSettings } = require("./settings.cjs");

const printWarning = (message) => console.log(`\n  Warning: ${message}\n`);

const collectChangedFiles = (opts) => {
  if (opts.useStaged) {
    return { source: "staged", files: getStagedFiles() };
  }
  if (opts.useUnstaged) {
    return { source: "unstaged", files: getUnstagedFiles() };
  }
  const staged = getStagedFiles();
  if (staged.length) {
    return { source: "staged", files: staged };
  }
  return { source: "unstaged", files: getUnstagedFiles() };
};

const runCodemod = async (opts = {}) => {
  const settings = resolveSettings();

  if (settings.skip) {
    console.log("\n  CODEMOD_SKIP=1 set — skipping codemod.\n");
    return { status: "skipped" };
  }

  const { source: changeSource, files } = collectChangedFiles(opts);

  if (!files.length) {
    console.log(`\n  No ${changeSource} changes — nothing to sync.\n`);
    return { status: "no-changes" };
  }

  const { grouped, changedPackages } = detectSyncableChange(files);

  if (changedPackages.length === 0) {
    console.log(
      `\n  No ${changeSource} changes in syncable paths — nothing to sync.\n`,
    );
    return { status: "no-syncable-changes" };
  }

  if (changedPackages.length > 1 && !settings.sourceOverride) {
    console.log(
      `\n  ${changeSource} changes touch multiple packages (${changedPackages.join(", ")}).`,
    );
    console.log(
      `  Codemod only runs when exactly ONE package changes (to avoid recursive syncing).`,
    );
    console.log(`  Set CODEMOD_SOURCE=<package> to force a source if needed.\n`);
    return { status: "ambiguous-source", changedPackages };
  }

  const sourcePackage = settings.sourceOverride || changedPackages[0];

  if (!PACKAGE_NAMES.includes(sourcePackage)) {
    printWarning(
      `CODEMOD_SOURCE="${sourcePackage}" is not a known package. Known: ${PACKAGE_NAMES.join(", ")}`,
    );
    return { status: "invalid-source" };
  }

  const sourceFiles = grouped[sourcePackage] || [];
  if (!sourceFiles.length) {
    printWarning(
      `Source package "${sourcePackage}" has no ${changeSource} files — nothing to use as the change reference.`,
    );
    return { status: "no-source-files" };
  }

  const targetPackages = PACKAGE_NAMES.filter((name) => name !== sourcePackage);
  const sourceStat = getStagedStatForFiles(sourceFiles);
  const sourceDiff =
    changeSource === "staged"
      ? getStagedDiffForFiles(sourceFiles)
      : "(unstaged mode — see current file contents below for the changed source files)";

  console.log(
    `\n  Source package: ${sourcePackage} (${sourceFiles.length} file${sourceFiles.length === 1 ? "" : "s"})`,
  );
  console.log(`  Targets: ${targetPackages.join(", ")}`);

  const { model: initialModel, modelChoices } = await selectModel(settings);
  const readyModel = await ensureModelReady(modelChoices, initialModel);

  let motivation = "";
  if (!settings.auto) {
    motivation = await promptText(
      "Motivation / context for these changes (optional, press Enter to skip)",
    );
  }

  const prompt = buildPrompt({
    sourcePackage,
    targetPackages,
    sourceFiles,
    sourceStat,
    sourceDiff,
    motivation,
  });

  const largeDiff = sourceDiff.length > settings.largeDiffThreshold;
  const executionModel = resolveExecutionModel(readyModel, largeDiff, settings);

  console.log("");
  const renderer = createProgressRenderer({
    label: `codemod (${getExecutionModelLabel(readyModel, executionModel)})`,
  });

  let suggestion;
  try {
    suggestion = await getCodemodSuggestion(
      prompt,
      readyModel,
      settings,
      executionModel,
      { onProgress: renderer.onProgress },
    );
    renderer.finish(true);
  } catch (error) {
    renderer.finish(false, error.message);
    return { status: "ai-error", error: error.message };
  }

  const validationErrors = validateChanges(suggestion.changes, targetPackages);
  if (validationErrors.length) {
    console.log("\n  Codemod proposed invalid changes:");
    validationErrors.forEach((err) => console.log(`    - ${err}`));
    console.log(
      "\n  Aborting. Fix the prompt or apply changes by hand.\n",
    );
    return { status: "invalid-changes", validationErrors };
  }

  const confirmed = await previewAndConfirm(suggestion, settings);

  if (!confirmed) {
    console.log("\n  Codemod aborted. No files changed.\n");
    return { status: "aborted", suggestion };
  }

  const applied = applyChanges(suggestion.changes);
  const changedCount = applied.filter(
    (a) => a.applied === "created" || a.applied === "updated" || a.applied === "deleted",
  ).length;
  const unchangedCount = applied.length - changedCount;

  console.log(
    `\n  Applied ${changedCount} file change${changedCount === 1 ? "" : "s"} across ${targetPackages.join(", ")}.`,
  );
  if (unchangedCount) {
    console.log(
      `  (${unchangedCount} file${unchangedCount === 1 ? "" : "s"} were already in the proposed state.)`,
    );
  }
  console.log(
    `\n  These files are left UNSTAGED. Review with \`git diff\` and \`git add\` what you want to keep.\n`,
  );

  return {
    status: "applied",
    sourcePackage,
    targetPackages,
    suggestion,
    applied,
  };
};

module.exports = {
  runCodemod,
};
