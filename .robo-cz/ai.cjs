/* eslint-disable */
/* eslint-disable no-console */
"use strict";

const {
  CHUNK_SUMMARY_JSON_SCHEMA,
  COMMIT_JSON_SCHEMA,
} = require("./shared.cjs");
const {
  buildAggregatePrompt,
  buildChunkSummaryPrompt,
  buildPrompt,
  normalizeAiSuggestion,
  parseJsonResponse,
} = require("./commit.cjs");
const { createAiProviders } = require("../.robo-shared/ai.cjs");

const providers = createAiProviders({
  tool: "cz",
  responseSchema: COMMIT_JSON_SCHEMA,
  temperature: 0.3,
  schemaName: "commit_message",
  idleTimeoutMs: 90000,
  manualLabel: "Manual (no AI)",
});

const {
  buildModelChoices,
  buildOpenRouterModelChoiceName,
  decodeOpenRouterModelChoice,
  encodeOpenRouterModelChoice,
  getDefaultModelChoice,
  getExecutionModelLabel,
  getMissingKeyMessage,
  getModelChoiceLabel,
  getProviderFromChoice,
  invokeProvider,
  promptForModel,
  resolveExecutionModel,
} = providers;

const getAiSuggestion = async (
  stat,
  diff,
  motivation,
  model,
  settings,
  executionModel = null,
  { onProgress } = {},
) => {
  const provider = getProviderFromChoice(model);

  if (!provider) {
    throw new Error("Cannot generate an AI suggestion in manual mode.");
  }

  const prompt = buildPrompt(stat, diff, motivation);
  const result = await invokeProvider(
    provider,
    prompt,
    executionModel || resolveExecutionModel(model, false, settings),
    { responseSchema: COMMIT_JSON_SCHEMA, onProgress },
  );
  const parsedSuggestion = normalizeAiSuggestion(parseJsonResponse(result));

  if (parsedSuggestion.wasTypeNormalized) {
    console.log(
      `\n  Warning: AI suggested unknown type; defaulting to "${parsedSuggestion.suggestion.type}"`,
    );
  }

  return parsedSuggestion.suggestion;
};

const normalizeChunkSummary = (parsed) => {
  const keyAreas = Array.isArray(parsed?.keyAreas)
    ? parsed.keyAreas
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    : [];
  const riskFlags = Array.isArray(parsed?.riskFlags)
    ? parsed.riskFlags
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    : [];
  const breakingSignals = Array.isArray(parsed?.breakingSignals)
    ? parsed.breakingSignals
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    : [];

  return {
    chunkSummary:
      typeof parsed?.chunkSummary === "string" && parsed.chunkSummary.trim()
        ? parsed.chunkSummary.trim()
        : "No summary provided.",
    keyAreas,
    riskFlags,
    breakingSignals,
  };
};

const getAiChunkSummary = async (
  stat,
  chunkStat,
  chunkDiff,
  chunkNumber,
  chunkCount,
  motivation,
  model,
  settings,
  executionModel = null,
  { onProgress } = {},
) => {
  const provider = getProviderFromChoice(model);

  if (!provider) {
    throw new Error("Cannot generate an AI chunk summary in manual mode.");
  }

  const prompt = buildChunkSummaryPrompt(
    stat,
    chunkStat,
    chunkDiff,
    chunkNumber,
    chunkCount,
    motivation,
  );
  const result = await invokeProvider(
    provider,
    prompt,
    executionModel || resolveExecutionModel(model, true, settings),
    { responseSchema: CHUNK_SUMMARY_JSON_SCHEMA, onProgress },
  );

  return normalizeChunkSummary(parseJsonResponse(result));
};

const getAiSuggestionFromChunkSummaries = async (
  stat,
  chunkSummaries,
  motivation,
  model,
  settings,
  executionModel = null,
  { onProgress } = {},
) => {
  const provider = getProviderFromChoice(model);

  if (!provider) {
    throw new Error("Cannot generate an AI suggestion in manual mode.");
  }

  const prompt = buildAggregatePrompt(stat, chunkSummaries, motivation);
  const result = await invokeProvider(
    provider,
    prompt,
    executionModel || resolveExecutionModel(model, true, settings),
    { responseSchema: COMMIT_JSON_SCHEMA, onProgress },
  );
  const parsedSuggestion = normalizeAiSuggestion(parseJsonResponse(result));

  if (parsedSuggestion.wasTypeNormalized) {
    console.log(
      `\n  Warning: AI suggested unknown type; defaulting to "${parsedSuggestion.suggestion.type}"`,
    );
  }

  return parsedSuggestion.suggestion;
};

module.exports = {
  buildModelChoices,
  buildOpenRouterModelChoiceName,
  decodeOpenRouterModelChoice,
  encodeOpenRouterModelChoice,
  getAiChunkSummary,
  getAiSuggestion,
  getAiSuggestionFromChunkSummaries,
  getDefaultModelChoice,
  getExecutionModelLabel,
  getMissingKeyMessage,
  getModelChoiceLabel,
  promptForModel,
  resolveExecutionModel,
};
