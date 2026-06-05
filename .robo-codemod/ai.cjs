/* eslint-disable */
/* eslint-disable no-console */
"use strict";

const { execFileSync } = require("child_process");

const {
  CLAUDE_CLI,
  CODEMOD_JSON_SCHEMA,
  GEMINI_DIRECT,
  MANUAL_VALUE,
  MAX_BUFFER,
  OPENAI_DIRECT,
  OPENROUTER_DIRECT,
  PROVIDER_CLAUDE_CLI,
  PROVIDER_GEMINI,
  PROVIDER_OPENAI,
  PROVIDER_OPENROUTER,
} = require("./shared.cjs");
const { parseJsonResponse } = require("./prompt.cjs");

const OPENROUTER_MODEL_PREFIX = "__openrouter_model__:";
const OPENROUTER_BACK_VALUE = "__openrouter_back__";

const PROVIDER_DEFS = {
  [PROVIDER_CLAUDE_CLI]: {
    choiceValue: CLAUDE_CLI,
    defaultSmallModel: "sonnet",
    defaultBigModel: "opus",
    envVar: null,
    label: "Claude CLI",
    invoke: (prompt, model) => callClaudeCli(prompt, model),
  },
  [PROVIDER_GEMINI]: {
    choiceValue: GEMINI_DIRECT,
    defaultSmallModel: "gemini-3.1-flash-lite",
    defaultBigModel: "gemini-3.1-pro-preview",
    envVar: "GEMINI_API_KEY",
    label: "Gemini",
    invoke: (prompt, model) => callGemini(prompt, model),
  },
  [PROVIDER_OPENAI]: {
    choiceValue: OPENAI_DIRECT,
    defaultSmallModel: "gpt-5.4-mini",
    defaultBigModel: "gpt-5.4",
    envVar: "OPENAI_API_KEY",
    label: "OpenAI",
    invoke: (prompt, model) => callOpenAi(prompt, model),
  },
  [PROVIDER_OPENROUTER]: {
    choiceValue: OPENROUTER_DIRECT,
    defaultSmallModel: "openrouter/auto",
    defaultBigModel: "openrouter/auto",
    envVar: "OPENROUTER_API_KEY",
    label: "OpenRouter",
    invoke: (prompt, model) => callOpenRouter(prompt, model),
  },
};

let openRouterModelChoicesPromise = null;

const callClaudeCli = (prompt, cliModel) =>
  execFileSync("claude", ["-p", "--model", cliModel], {
    input: prompt,
    encoding: "utf-8",
    timeout: 180000,
    maxBuffer: MAX_BUFFER,
  });

const callGemini = async (
  prompt,
  model,
  responseSchema = CODEMOD_JSON_SCHEMA,
) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseJsonSchema: responseSchema,
        },
      }),
    },
  );

  return extractResponseText(response, "Gemini API", (data) =>
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim(),
  );
};

const callOpenAi = async (
  prompt,
  model,
  responseSchema = CODEMOD_JSON_SCHEMA,
) => {
  const endpoint = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };
  let response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(
      buildChatCompletionPayload(prompt, model, responseSchema, true),
    ),
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (isStructuredOutputUnsupported(response.status, errorText)) {
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(
          buildChatCompletionPayload(prompt, model, responseSchema, false),
        ),
      });
    } else {
      throw new Error(
        `OpenAI API error (${response.status}): ${errorText.slice(0, 200)}`,
      );
    }
  }

  return extractResponseText(
    response,
    "OpenAI API",
    (data) => data.choices?.[0]?.message?.content,
  );
};

const callOpenRouter = async (
  prompt,
  model,
  responseSchema = CODEMOD_JSON_SCHEMA,
) => {
  const endpoint = "https://openrouter.ai/api/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  };
  let response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(
      buildChatCompletionPayload(prompt, model, responseSchema, true),
    ),
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (isStructuredOutputUnsupported(response.status, errorText)) {
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(
          buildChatCompletionPayload(prompt, model, responseSchema, false),
        ),
      });
    } else {
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorText.slice(0, 200)}`,
      );
    }
  }

  return extractResponseText(
    response,
    "OpenRouter API",
    (data) => data.choices?.[0]?.message?.content,
  );
};

const buildChatCompletionPayload = (
  prompt,
  model,
  responseSchema = CODEMOD_JSON_SCHEMA,
  useStructuredOutput = true,
) => {
  const payload = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  };

  if (useStructuredOutput) {
    payload.response_format = {
      type: "json_schema",
      json_schema: {
        name: "codemod_changes",
        strict: true,
        schema: responseSchema,
      },
    };
  }

  return payload;
};

const isStructuredOutputUnsupported = (status, errorText) => {
  if (status !== 400) {
    return false;
  }

  return /response_format|json_schema|structured output|not supported/i.test(
    errorText,
  );
};

const extractResponseText = async (response, sourceLabel, pickText) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `${sourceLabel} error (${response.status}): ${errorText.slice(0, 200)}`,
    );
  }

  const data = await response.json();
  const text = pickText(data);

  if (!text) {
    throw new Error(`${sourceLabel} returned an empty response`);
  }

  return text;
};

const getProviderModels = (settings, provider) => {
  const providerDef = PROVIDER_DEFS[provider];
  const override =
    settings.defaultProvider?.provider === provider
      ? settings.defaultProvider
      : null;

  return {
    smallModel: override?.smallModel || providerDef.defaultSmallModel,
    bigModel: override?.bigModel || providerDef.defaultBigModel,
  };
};

const encodeOpenRouterModelChoice = (modelId) =>
  `${OPENROUTER_MODEL_PREFIX}${modelId}`;

const decodeOpenRouterModelChoice = (model) => {
  if (typeof model !== "string" || !model.startsWith(OPENROUTER_MODEL_PREFIX)) {
    return null;
  }

  return model.slice(OPENROUTER_MODEL_PREFIX.length);
};

const isOpenRouterModelChoice = (model) =>
  decodeOpenRouterModelChoice(model) !== null;

const getProviderFromChoice = (model) => {
  if (model === MANUAL_VALUE) {
    return null;
  }

  if (isOpenRouterModelChoice(model)) {
    return PROVIDER_OPENROUTER;
  }

  return (
    Object.keys(PROVIDER_DEFS).find(
      (provider) => PROVIDER_DEFS[provider].choiceValue === model,
    ) || null
  );
};

const getDefaultModelChoice = (settings) => {
  if (!settings.defaultProvider) {
    return MANUAL_VALUE;
  }

  if (settings.defaultProvider.provider === PROVIDER_OPENROUTER) {
    const configuredModel =
      settings.defaultProvider.smallModel || settings.defaultProvider.bigModel;
    return configuredModel
      ? encodeOpenRouterModelChoice(configuredModel)
      : OPENROUTER_DIRECT;
  }

  return PROVIDER_DEFS[settings.defaultProvider.provider].choiceValue;
};

const formatModelVariantLabel = (model) => {
  const friendlyLabels = {
    haiku: "Haiku",
    sonnet: "Sonnet",
    opus: "Opus",
    "gemini-3.1-flash-lite": "3.1 Flash Lite",
    "gemini-3.1-pro-preview": "3.1 Pro Preview",
    "gpt-5.4-mini": "5.4 Mini",
    "gpt-5.4": "5.4",
  };

  return friendlyLabels[model] || model;
};

const buildAutoSelectChoiceName = (label, smallModel, bigModel) =>
  smallModel === bigModel
    ? `${label} (${formatModelVariantLabel(smallModel)})`
    : `${label} (auto-selects ${formatModelVariantLabel(smallModel)} or ${formatModelVariantLabel(bigModel)})`;

const buildProviderChoice = (provider, settings) => {
  const providerDef = PROVIDER_DEFS[provider];

  if (provider === PROVIDER_OPENROUTER) {
    return {
      value: providerDef.choiceValue,
      name: `${providerDef.label} (choose any model)`,
    };
  }

  const { smallModel, bigModel } = getProviderModels(settings, provider);

  return {
    value: providerDef.choiceValue,
    name: buildAutoSelectChoiceName(providerDef.label, smallModel, bigModel),
  };
};

const buildModelChoices = (settings) => [
  { value: MANUAL_VALUE, name: "Skip (no AI)" },
  buildProviderChoice(PROVIDER_CLAUDE_CLI, settings),
  buildProviderChoice(PROVIDER_GEMINI, settings),
  buildProviderChoice(PROVIDER_OPENAI, settings),
  buildProviderChoice(PROVIDER_OPENROUTER, settings),
];

const fetchOpenRouterModelChoices = async () => {
  const response = await fetch("https://openrouter.ai/api/v1/models");

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter models error (${response.status}): ${errorText.slice(0, 200)}`,
    );
  }

  const data = await response.json();
  const models = Array.isArray(data?.data) ? data.data : [];

  return models
    .filter((model) => model && typeof model.id === "string" && model.id.trim())
    .map((model) => ({
      value: encodeOpenRouterModelChoice(model.id),
      name: buildOpenRouterModelChoiceName(model),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
};

const getOpenRouterModelChoices = async () => {
  if (!openRouterModelChoicesPromise) {
    openRouterModelChoicesPromise = fetchOpenRouterModelChoices().catch(
      (error) => {
        openRouterModelChoicesPromise = null;
        throw error;
      },
    );
  }

  return openRouterModelChoicesPromise;
};

const buildOpenRouterModelChoiceName = (model) => {
  const primaryName =
    typeof model.name === "string" && model.name.trim()
      ? model.name.trim()
      : model.id;
  return `${primaryName} (${model.id})`;
};

const getRequiredEnvVar = (model) => {
  const provider = getProviderFromChoice(model);
  return provider ? PROVIDER_DEFS[provider].envVar : null;
};

const getModelChoiceLabel = (model) => {
  if (model === MANUAL_VALUE) {
    return "Skipped";
  }

  const openRouterModel = decodeOpenRouterModelChoice(model);
  if (openRouterModel) {
    return `OpenRouter (${openRouterModel})`;
  }

  const provider = getProviderFromChoice(model);
  return provider ? PROVIDER_DEFS[provider].label : model;
};

const getMissingKeyMessage = (model) => {
  const envVar = getRequiredEnvVar(model);

  if (!envVar || process.env[envVar]) {
    return null;
  }

  return `${getModelChoiceLabel(model)} needs \`${envVar}\` before it can run.\n\n  export ${envVar}=your_key_here`;
};

const resolveExecutionModel = (model, largeDiff, settings) => {
  const openRouterModel = decodeOpenRouterModelChoice(model);
  if (openRouterModel) {
    return openRouterModel;
  }

  const provider = getProviderFromChoice(model);

  if (!provider) {
    return null;
  }

  const { smallModel, bigModel } = getProviderModels(settings, provider);
  return largeDiff ? bigModel : smallModel;
};

const getExecutionModelLabel = (_selectedModel, executionModel) =>
  formatModelVariantLabel(executionModel);

const invokeProvider = async (
  provider,
  prompt,
  model,
  responseSchema = CODEMOD_JSON_SCHEMA,
) => PROVIDER_DEFS[provider].invoke(prompt, model, responseSchema);

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
          action:
            change?.action === "delete" ? "delete" : "write",
          content:
            typeof change?.content === "string" ? change.content : "",
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
    CODEMOD_JSON_SCHEMA,
  );

  return normalizeCodemodResult(parseJsonResponse(result));
};

module.exports = {
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
  OPENROUTER_BACK_VALUE,
  resolveExecutionModel,
};
