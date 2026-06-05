/* eslint-disable */
"use strict";

const { MANUAL_VALUE } = require("./shared.cjs");
const {
  buildCommitMessage,
  buildHeadlessInstructions,
  chunkFiles,
  formatScope,
  getStagedDiffForFiles,
  getStagedDiff,
  getStagedFiles,
  getStagedStatForFiles,
  getStagedStat,
  normalizeCommitParts,
  validateHeadlessCommitParts,
} = require("./commit.cjs");
const {
  buildModelChoices,
  getAiChunkSummary,
  getAiSuggestion,
  getAiSuggestionFromChunkSummaries,
  getDefaultModelChoice,
  getExecutionModelLabel,
  getMissingKeyMessage,
  getModelChoiceLabel,
  promptForModel,
  resolveExecutionModel,
} = require("./ai.cjs");
const { promptForCommit } = require("./prompt-flow.cjs");
const { resolveSettings } = require("./settings.cjs");

const readHeadlessCommitParts = () =>
  normalizeCommitParts({
    type: process.env.CZ_AI_TYPE || "",
    scope: process.env.CZ_AI_SCOPE || "",
    subject: process.env.CZ_AI_SUBJECT || "",
    body: process.env.CZ_AI_BODY || "",
    breaking: process.env.CZ_AI_BREAKING || "",
  });

const printJson = (value) => {
  console.log(JSON.stringify(value, null, 2));
};

const printWarning = (message) => {
  console.log(`\n  Warning: ${message}\n`);
};

const ensureModelReady = async (cz, modelChoices, model) => {
  let nextModel = model;

  while (nextModel !== MANUAL_VALUE) {
    const missingKeyMessage = getMissingKeyMessage(nextModel);

    if (!missingKeyMessage) {
      return nextModel;
    }

    printWarning(missingKeyMessage);
    nextModel = await promptForModel(cz, modelChoices, MANUAL_VALUE);
  }

  return nextModel;
};

const runHeadlessPrompter = async (commit, stat) => {
  const headlessCommit = readHeadlessCommitParts();

  if (!headlessCommit.subject) {
    printJson(buildHeadlessInstructions(stat));
    return;
  }

  const errors = validateHeadlessCommitParts(headlessCommit);
  if (errors.length) {
    printJson({ errors });
    return;
  }

  console.log(
    `\n  Headless mode - committing: ${headlessCommit.type}${formatScope(headlessCommit.scope)}: ${headlessCommit.subject}\n`,
  );
  commit(buildCommitMessage(headlessCommit));
};

const shouldUseLargeCommitStrategy = (stagedFiles, settings) =>
  Array.isArray(stagedFiles) &&
  stagedFiles.length >= settings.largeCommitFileThreshold;

const selectModel = async (cz, settings) => {
  const modelChoices = buildModelChoices(settings);
  const initialModel = getDefaultModelChoice(settings);

  settings.warnings.forEach(printWarning);

  if (settings.skipModelSelection) {
    if (initialModel !== MANUAL_VALUE) {
      const missingKeyMessage = getMissingKeyMessage(initialModel);

      if (missingKeyMessage) {
        printWarning(`Configured default unavailable. ${missingKeyMessage}`);
        return {
          model: MANUAL_VALUE,
          modelChoices,
        };
      }

      console.log(
        `\n  Model: ${getModelChoiceLabel(initialModel)} (from env)\n`,
      );
      return {
        model: initialModel,
        modelChoices,
      };
    }

    return {
      model: MANUAL_VALUE,
      modelChoices,
    };
  }

  const model = await promptForModel(cz, modelChoices, initialModel);

  return {
    model,
    modelChoices,
  };
};

const generateAiSuggestion = async (
  cz,
  stat,
  diff,
  model,
  settings,
  modelChoices,
) => {
  const largeDiff = diff.length > settings.largeDiffThreshold;
  const { motivation } = await cz.prompt([
    {
      type: "input",
      name: "motivation",
      message:
        "Motivation / context for these changes (optional, press Enter to skip):",
    },
  ]);

  let selectedModel = model;
  let suggestion = null;

  while (!suggestion) {
    if (selectedModel === MANUAL_VALUE) {
      return {
        model: selectedModel,
        suggestion: null,
      };
    }

    selectedModel = await ensureModelReady(cz, modelChoices, selectedModel);
    if (selectedModel === MANUAL_VALUE) {
      return {
        model: selectedModel,
        suggestion: null,
      };
    }

    const executionModel = resolveExecutionModel(
      selectedModel,
      largeDiff,
      settings,
    );
    process.stdout.write(
      `  Generating AI suggestion (${getExecutionModelLabel(selectedModel, executionModel)})...`,
    );

    try {
      suggestion = await getAiSuggestion(
        stat,
        diff,
        motivation,
        selectedModel,
        settings,
        executionModel,
      );
      console.log(
        ` done!\n\n  Suggestion: ${suggestion.type}${formatScope(suggestion.scope)}: ${suggestion.subject}\n`,
      );
    } catch (error) {
      console.log(` failed.\n\n  Warning: ${error.message}\n`);
      selectedModel = await promptForModel(cz, modelChoices, selectedModel);
    }
  }

  return {
    model: selectedModel,
    suggestion,
  };
};

const generateLargeCommitSuggestion = async (
  stat,
  stagedFiles,
  motivation,
  model,
  settings,
) => {
  const chunks = chunkFiles(stagedFiles, settings.largeCommitChunkSize);
  const chunkSummaries = [];
  const executionModel = resolveExecutionModel(model, true, settings);

  console.log(
    `\n  Large commit detected (${stagedFiles.length} files). Running chunked multi-agent analysis across ${chunks.length} chunks.\n`,
  );

  for (let index = 0; index < chunks.length; index += 1) {
    const chunkFilesList = chunks[index];
    const chunkNumber = index + 1;
    const chunkStat = getStagedStatForFiles(chunkFilesList);
    const chunkDiff = getStagedDiffForFiles(
      chunkFilesList,
      settings.largeCommitChunkDiffChars,
    );

    process.stdout.write(
      `  Chunk ${chunkNumber}/${chunks.length}: summarizing ${chunkFilesList.length} files...`,
    );
    const summary = await getAiChunkSummary(
      stat,
      chunkStat,
      chunkDiff,
      chunkNumber,
      chunks.length,
      motivation,
      model,
      settings,
      executionModel,
    );
    console.log(" done.");

    chunkSummaries.push({
      index: chunkNumber,
      totalChunks: chunks.length,
      fileCount: chunkFilesList.length,
      fileSample: chunkFilesList.slice(0, 5),
      summary,
    });
  }

  process.stdout.write(
    `  Synthesizing final suggestion (${getExecutionModelLabel(model, executionModel)})...`,
  );
  const suggestion = await getAiSuggestionFromChunkSummaries(
    stat,
    chunkSummaries,
    motivation,
    model,
    settings,
    executionModel,
  );
  console.log(
    ` done!\n\n  Suggestion: ${suggestion.type}${formatScope(suggestion.scope)}: ${suggestion.subject}\n`,
  );

  return suggestion;
};

const prompter = async (cz, commit) => {
  const stat = getStagedStat();

  if (!stat) {
    console.log("\n  No staged changes. Run `git add` first.\n");
    return;
  }

  if (process.env.CZ_AI_HEADLESS === "1") {
    return runHeadlessPrompter(commit, stat);
  }

  const settings = resolveSettings();
  const { model: selectedModel, modelChoices } = await selectModel(
    cz,
    settings,
  );
  const readyModel = await ensureModelReady(cz, modelChoices, selectedModel);

  if (readyModel === MANUAL_VALUE) {
    return promptForCommit(cz, commit, null);
  }

  const stagedFiles = getStagedFiles();
  const useLargeCommitStrategy = shouldUseLargeCommitStrategy(
    stagedFiles,
    settings,
  );

  if (useLargeCommitStrategy) {
    const { motivation } = await cz.prompt([
      {
        type: "input",
        name: "motivation",
        message:
          "Motivation / context for these changes (optional, press Enter to skip):",
      },
    ]);

    try {
      const suggestion = await generateLargeCommitSuggestion(
        stat,
        stagedFiles,
        motivation,
        readyModel,
        settings,
      );
      return promptForCommit(cz, commit, suggestion);
    } catch (error) {
      console.log(
        `\n  Warning: Large-commit analysis failed (${error.message}). Falling back to single-pass mode.\n`,
      );
    }
  }

  const diff = getStagedDiff();
  const { suggestion } = await generateAiSuggestion(
    cz,
    stat,
    diff,
    readyModel,
    settings,
    modelChoices,
  );
  return promptForCommit(cz, commit, suggestion);
};

module.exports = {
  prompter,
  shouldUseLargeCommitStrategy,
};
