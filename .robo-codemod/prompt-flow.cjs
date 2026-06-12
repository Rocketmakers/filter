/* eslint-disable */
/* eslint-disable no-console */
"use strict";

const inquirer = require("inquirer");

const { MANUAL_VALUE } = require("./shared.cjs");
const {
  buildModelChoices,
  getDefaultModelChoice,
  getMissingKeyMessage,
  getModelChoiceLabel,
  promptForModel,
} = require("./ai.cjs");
const { summarizeChanges } = require("./apply.cjs");

const promptConfirm = async (message, defaultYes = true) => {
  const { confirmed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message,
      default: defaultYes,
    },
  ]);
  return confirmed;
};

const promptText = async (message) => {
  const { value } = await inquirer.prompt([
    {
      type: "input",
      name: "value",
      message,
    },
  ]);
  return value.trim();
};

// Codemod is AI-only — there's no Skip option, so this loops until the user
// either picks a provider whose API key is set, or aborts with Ctrl+C.
const ensureModelReady = async (modelChoices, model) => {
  let nextModel = model;

  while (true) {
    const missingKeyMessage = getMissingKeyMessage(nextModel);
    if (!missingKeyMessage) return nextModel;

    console.log(`\n  Warning: ${missingKeyMessage}\n`);
    nextModel = await promptForModel(inquirer, modelChoices, nextModel);
  }
};

const selectModel = async (settings) => {
  const modelChoices = buildModelChoices(settings);
  const initialModel = getDefaultModelChoice(settings);

  settings.warnings.forEach((warning) => console.log(`\n  Warning: ${warning}\n`));

  if (settings.skipModelSelection || settings.auto) {
    if (initialModel === MANUAL_VALUE) {
      throw new Error(
        "Codemod requires an AI provider, but none is configured. " +
          "Set CODEMOD_PROVIDER (and the matching API key) before running with CODEMOD_AUTO=1.",
      );
    }

    const missingKeyMessage = getMissingKeyMessage(initialModel);
    if (missingKeyMessage) throw new Error(missingKeyMessage);

    console.log(`\n  Model: ${getModelChoiceLabel(initialModel)} (from env)\n`);
    return { model: initialModel, modelChoices };
  }

  // Picker has no Skip option, so if initialModel is MANUAL_VALUE (no env
  // preset), seed the prompt with the first real provider so the highlight
  // lands on something selectable.
  const seededInitial =
    initialModel === MANUAL_VALUE ? modelChoices[0]?.value : initialModel;
  const model = await promptForModel(inquirer, modelChoices, seededInitial);
  return { model, modelChoices };
};

const previewAndConfirm = async (suggestion, settings) => {
  console.log("\n  ---------------------------------------------");
  console.log(`  Summary: ${suggestion.summary}`);
  if (suggestion.rationale) {
    console.log("");
    suggestion.rationale.split("\n").forEach((line) => console.log(`  ${line}`));
  }
  console.log("\n  Proposed changes:");
  console.log(summarizeChanges(suggestion.changes));
  console.log("  ---------------------------------------------\n");

  if (!suggestion.changes.length) {
    console.log("  No file changes proposed — codemod decided no propagation was needed.\n");
    return false;
  }

  if (settings.auto) {
    console.log("  CODEMOD_AUTO=1 → applying changes without confirmation.\n");
    return true;
  }

  return promptConfirm(
    "Apply these changes to target package files? (left unstaged for your review)",
    true,
  );
};

module.exports = {
  ensureModelReady,
  previewAndConfirm,
  promptConfirm,
  promptText,
  selectModel,
};
