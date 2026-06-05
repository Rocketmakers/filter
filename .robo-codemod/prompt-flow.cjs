/* eslint-disable */
/* eslint-disable no-console */
"use strict";

const readline = require("readline");

const { MANUAL_VALUE } = require("./shared.cjs");
const {
  buildModelChoices,
  decodeOpenRouterModelChoice,
  encodeOpenRouterModelChoice,
  getDefaultModelChoice,
  getMissingKeyMessage,
  getModelChoiceLabel,
  getOpenRouterModelChoices,
  isOpenRouterModelChoice,
  OPENROUTER_BACK_VALUE,
} = require("./ai.cjs");
const { summarizeChanges } = require("./apply.cjs");

const OPENROUTER_DIRECT = "__openrouter__";

const createInterface = () =>
  readline.createInterface({ input: process.stdin, output: process.stdout });

const question = (rl, message) =>
  new Promise((resolveAnswer) => rl.question(message, (answer) => resolveAnswer(answer)));

const promptList = async (message, choices, defaultIndex = 0) => {
  const rl = createInterface();
  try {
    console.log(`\n${message}`);
    choices.forEach((choice, index) => {
      const marker = index === defaultIndex ? "›" : " ";
      console.log(`  ${marker} ${index + 1}. ${choice.name}`);
    });
    const answer = (
      await question(rl, `Choose [1-${choices.length}] (default ${defaultIndex + 1}): `)
    ).trim();
    if (!answer) {
      return choices[defaultIndex];
    }
    const idx = Number.parseInt(answer, 10) - 1;
    if (Number.isInteger(idx) && idx >= 0 && idx < choices.length) {
      return choices[idx];
    }
    console.log(`Invalid selection. Using default: ${choices[defaultIndex].name}`);
    return choices[defaultIndex];
  } finally {
    rl.close();
  }
};

const promptConfirm = async (message, defaultYes = true) => {
  const rl = createInterface();
  try {
    const suffix = defaultYes ? "[Y/n]" : "[y/N]";
    const answer = (await question(rl, `${message} ${suffix}: `)).trim().toLowerCase();
    if (!answer) {
      return defaultYes;
    }
    return answer.startsWith("y");
  } finally {
    rl.close();
  }
};

const promptText = async (message) => {
  const rl = createInterface();
  try {
    return (await question(rl, `${message}: `)).trim();
  } finally {
    rl.close();
  }
};

const promptForModel = async (choices, currentModel = MANUAL_VALUE) => {
  const normalizedCurrent = isOpenRouterModelChoice(currentModel)
    ? OPENROUTER_DIRECT
    : currentModel;
  const defaultIndex = Math.max(
    choices.findIndex((choice) => choice.value === normalizedCurrent),
    0,
  );
  const selected = await promptList("Model:", choices, defaultIndex);

  if (selected.value === OPENROUTER_DIRECT) {
    const openRouterModel = await promptForOpenRouterModel(currentModel);
    if (openRouterModel === OPENROUTER_BACK_VALUE) {
      return promptForModel(choices, currentModel);
    }
    return openRouterModel;
  }

  return selected.value;
};

const promptForOpenRouterModel = async (currentModel) => {
  let choices;
  try {
    choices = await getOpenRouterModelChoices();
  } catch (error) {
    console.log(`\n  Warning: failed to fetch OpenRouter models: ${error.message}\n`);
    return OPENROUTER_BACK_VALUE;
  }

  const currentOpenRouterModel = decodeOpenRouterModelChoice(currentModel);
  const allChoices = [
    { value: OPENROUTER_BACK_VALUE, name: "Back" },
    ...choices,
  ];
  const defaultChoice = currentOpenRouterModel
    ? encodeOpenRouterModelChoice(currentOpenRouterModel)
    : allChoices[1]?.value;
  const defaultIndex = Math.max(
    allChoices.findIndex((choice) => choice.value === defaultChoice),
    0,
  );

  console.log(
    `\nOpenRouter model: (${allChoices.length} options — type a number, or type "search:<text>" to filter)`,
  );

  const rl = createInterface();
  try {
    while (true) {
      const answer = (
        await question(rl, `Choose [1-${allChoices.length}] (default ${defaultIndex + 1}): `)
      ).trim();
      if (!answer) {
        return allChoices[defaultIndex].value;
      }
      if (answer.startsWith("search:")) {
        const term = answer.slice("search:".length).trim().toLowerCase();
        const matches = allChoices.filter(
          (c, i) => i > 0 && c.name.toLowerCase().includes(term),
        );
        if (!matches.length) {
          console.log("  (no matches)");
          continue;
        }
        matches.slice(0, 30).forEach((m) => {
          const idx = allChoices.indexOf(m) + 1;
          console.log(`    ${idx}. ${m.name}`);
        });
        if (matches.length > 30) {
          console.log(`    ... ${matches.length - 30} more`);
        }
        continue;
      }
      const idx = Number.parseInt(answer, 10) - 1;
      if (Number.isInteger(idx) && idx >= 0 && idx < allChoices.length) {
        return allChoices[idx].value;
      }
      console.log(`Invalid selection.`);
    }
  } finally {
    rl.close();
  }
};

const ensureModelReady = async (modelChoices, model) => {
  let nextModel = model;

  while (nextModel !== MANUAL_VALUE) {
    const missingKeyMessage = getMissingKeyMessage(nextModel);

    if (!missingKeyMessage) {
      return nextModel;
    }

    console.log(`\n  Warning: ${missingKeyMessage}\n`);
    nextModel = await promptForModel(modelChoices, MANUAL_VALUE);
  }

  return nextModel;
};

const selectModel = async (settings) => {
  const modelChoices = buildModelChoices(settings);
  const initialModel = getDefaultModelChoice(settings);

  settings.warnings.forEach((warning) => console.log(`\n  Warning: ${warning}\n`));

  if (settings.skipModelSelection || settings.auto) {
    if (initialModel !== MANUAL_VALUE) {
      const missingKeyMessage = getMissingKeyMessage(initialModel);

      if (missingKeyMessage) {
        console.log(`\n  Warning: ${missingKeyMessage}\n`);
        return { model: MANUAL_VALUE, modelChoices };
      }

      console.log(`\n  Model: ${getModelChoiceLabel(initialModel)} (from env)\n`);
      return { model: initialModel, modelChoices };
    }

    return { model: MANUAL_VALUE, modelChoices };
  }

  const model = await promptForModel(modelChoices, initialModel);
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
