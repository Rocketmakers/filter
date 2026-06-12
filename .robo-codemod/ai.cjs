/* eslint-disable */
/* eslint-disable no-console */
"use strict";

const { CODEMOD_JSON_SCHEMA } = require("./shared.cjs");
const { parseJsonResponse } = require("./prompt.cjs");
const { createAiProviders } = require("../.robo-shared/ai.cjs");

const providers = createAiProviders({
  tool: "codemod",
  responseSchema: CODEMOD_JSON_SCHEMA,
  temperature: 0.2,
  schemaName: "codemod_changes",
  // Codemod prompts bundle full source + target file contents and can run
  // ~25K+ input tokens; Sonnet's TTFT on prompts that size can spike past 2
  // minutes under API load. With --include-partial-messages the post-TTFT
  // window stays noisy enough to keep the watchdog awake, but TTFT itself is
  // silent — give it room.
  idleTimeoutMs: 240000,
  // Codemod is AI-only — every change is a model-authored edit, so there's
  // no useful "skip" mode. Hide the option from the picker; if we ever see
  // MANUAL_VALUE here (e.g. env misconfigured) the caller throws.
  includeManualOption: false,
});

const {
  OPENROUTER_BACK_VALUE,
  buildModelChoices,
  decodeOpenRouterModelChoice,
  encodeOpenRouterModelChoice,
  getDefaultModelChoice,
  getExecutionModelLabel,
  getMissingKeyMessage,
  getModelChoiceLabel,
  getOpenRouterModelChoices,
  getProviderFromChoice,
  invokeProvider,
  isOpenRouterModelChoice,
  promptForModel,
  resolveExecutionModel,
} = providers;

const normalizeCodemodResult = (parsed) => {
  const summary =
    typeof parsed?.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : "(no summary)";
  const rationale =
    typeof parsed?.rationale === "string" && parsed.rationale.trim()
      ? parsed.rationale.trim()
      : "";
  const changes = Array.isArray(parsed?.changes)
    ? parsed.changes
        .map((change) => ({
          package:
            typeof change?.package === "string" ? change.package.trim() : "",
          path: typeof change?.path === "string" ? change.path.trim() : "",
          action: change?.action === "delete" ? "delete" : "write",
          content: typeof change?.content === "string" ? change.content : "",
        }))
        .filter((change) => change.package && change.path)
    : [];

  return { summary, rationale, changes };
};

const getCodemodSuggestion = async (
  prompt,
  model,
  settings,
  executionModel = null,
  { onProgress } = {},
) => {
  const provider = getProviderFromChoice(model);

  if (!provider) {
    throw new Error("Cannot generate a codemod suggestion in skipped mode.");
  }

  const resolved =
    executionModel || resolveExecutionModel(model, false, settings);
  const result = await invokeProvider(
    provider,
    prompt,
    resolved,
    { responseSchema: CODEMOD_JSON_SCHEMA, onProgress },
  );

  return normalizeCodemodResult(parseJsonResponse(result));
};

module.exports = {
  OPENROUTER_BACK_VALUE,
  buildModelChoices,
  decodeOpenRouterModelChoice,
  encodeOpenRouterModelChoice,
  getCodemodSuggestion,
  getDefaultModelChoice,
  getExecutionModelLabel,
  getMissingKeyMessage,
  getModelChoiceLabel,
  getOpenRouterModelChoices,
  isOpenRouterModelChoice,
  promptForModel,
  resolveExecutionModel,
};
