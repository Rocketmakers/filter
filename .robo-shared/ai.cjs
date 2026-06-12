/* eslint-disable */
/* eslint-disable no-console */
"use strict";

const { spawn } = require("child_process");
const readline = require("readline");

// =============================================================================
// Shared AI provider plumbing for .robo-cz and .robo-codemod.
//
// Both tools speak to the same set of providers (Claude CLI, Gemini, OpenAI,
// OpenRouter) and share almost-identical model-choice plumbing. The bits that
// genuinely differ between tools — JSON schema, temperature, Claude CLI
// timeout, default model tier per provider, "manual" choice label — are
// passed into `createAiProviders()` and the rest is reused.
//
// Update PROVIDER_CATALOG below when providers ship new models.
// =============================================================================

const MAX_BUFFER = 1024 * 1024 * 20;

const MANUAL_VALUE = "__manual__";
const CLAUDE_CLI = "__claude_cli__";
const GEMINI_DIRECT = "__gemini__";
const OPENAI_DIRECT = "__openai__";
const OPENROUTER_DIRECT = "__openrouter__";

const PROVIDER_CLAUDE_CLI = "claude-cli";
const PROVIDER_GEMINI = "gemini";
const PROVIDER_OPENAI = "openai";
const PROVIDER_OPENROUTER = "openrouter";

const SUPPORTED_PROVIDERS = [
  PROVIDER_CLAUDE_CLI,
  PROVIDER_GEMINI,
  PROVIDER_OPENAI,
  PROVIDER_OPENROUTER,
];

const PROVIDER_CHOICE_VALUES = {
  [PROVIDER_CLAUDE_CLI]: CLAUDE_CLI,
  [PROVIDER_GEMINI]: GEMINI_DIRECT,
  [PROVIDER_OPENAI]: OPENAI_DIRECT,
  [PROVIDER_OPENROUTER]: OPENROUTER_DIRECT,
};

const OPENROUTER_MODEL_PREFIX = "__openrouter_model__:";
const OPENROUTER_BACK_VALUE = "__openrouter_back__";

// -----------------------------------------------------------------------------
// PROVIDER_CATALOG
//
// Single source of truth for default model tiers and friendly display labels.
// `defaults[tool]` selects the small/big pair per tool ("cz" for commit
// messages — quick and cheap; "codemod" for code edits — capable). The
// `friendlyLabels` map turns raw model IDs into short human-readable names in
// the prompt UI.
//
// When providers ship new models, update this table — both .robo-cz and
// .robo-codemod will pick the changes up automatically. Only land model IDs
// you have independently verified (provider docs / API responses); the
// committed defaults must be ones the tools can actually call.
// -----------------------------------------------------------------------------
const PROVIDER_CATALOG = {
  [PROVIDER_CLAUDE_CLI]: {
    label: "Claude CLI",
    envVar: null,
    // Short tier aliases auto-route to the latest version of that tier
    // (haiku/sonnet/opus → Haiku 4.5 / Sonnet 4.6 / Opus 4.7 today).
    defaults: {
      cz: { small: "haiku", big: "sonnet" },
      codemod: { small: "sonnet", big: "opus" },
    },
    friendlyLabels: {
      haiku: "Haiku",
      sonnet: "Sonnet",
      opus: "Opus",
    },
  },
  [PROVIDER_GEMINI]: {
    label: "Gemini",
    envVar: "GEMINI_API_KEY",
    // `*-latest` aliases float to the current best in each tier — keeps the
    // catalog from drifting when a new minor version ships. As of Jun 2026:
    // flash-latest → 3.5 Flash, pro-latest → 3.1 Pro Preview (no 3.5 Pro yet).
    defaults: {
      cz: { small: "gemini-flash-lite-latest", big: "gemini-flash-latest" },
      codemod: { small: "gemini-flash-latest", big: "gemini-pro-latest" },
    },
    friendlyLabels: {
      "gemini-flash-lite-latest": "Flash Lite",
      "gemini-flash-latest": "Flash",
      "gemini-pro-latest": "Pro",
      "gemini-3.5-flash": "3.5 Flash",
      "gemini-3.1-flash-lite": "3.1 Flash Lite",
      "gemini-3.1-pro-preview": "3.1 Pro Preview",
      "gemini-2.5-flash-lite": "2.5 Flash Lite",
      "gemini-2.5-flash": "2.5 Flash",
      "gemini-2.5-pro": "2.5 Pro",
    },
  },
  [PROVIDER_OPENAI]: {
    label: "OpenAI",
    envVar: "OPENAI_API_KEY",
    // GPT-5.5 (Apr 23 2026) is current flagship; gpt-5.5-pro is its big
    // sibling. No 5.5-mini exists yet — latest small tier is gpt-5.4-mini.
    defaults: {
      cz: { small: "gpt-5.4-mini", big: "gpt-5.5" },
      codemod: { small: "gpt-5.5", big: "gpt-5.5-pro" },
    },
    friendlyLabels: {
      "gpt-5.5-pro": "5.5 Pro",
      "gpt-5.5": "5.5",
      "gpt-5.4-pro": "5.4 Pro",
      "gpt-5.4": "5.4",
      "gpt-5.4-mini": "5.4 Mini",
      "gpt-5.4-nano": "5.4 Nano",
      "gpt-5": "5",
      "gpt-5-mini": "5 Mini",
      "gpt-5-nano": "5 Nano",
      "gpt-4o": "4o",
      "gpt-4o-mini": "4o Mini",
      "gpt-4-turbo": "4 Turbo",
    },
  },
  [PROVIDER_OPENROUTER]: {
    label: "OpenRouter",
    envVar: "OPENROUTER_API_KEY",
    defaults: {
      cz: { small: "openrouter/auto", big: "openrouter/auto" },
      codemod: { small: "openrouter/auto", big: "openrouter/auto" },
    },
    friendlyLabels: {},
  },
};

const flattenFriendlyLabels = () => {
  const merged = {};
  for (const entry of Object.values(PROVIDER_CATALOG)) {
    Object.assign(merged, entry.friendlyLabels);
  }
  return merged;
};

const FRIENDLY_LABELS = flattenFriendlyLabels();

const formatModelVariantLabel = (model) => FRIENDLY_LABELS[model] || model;

// -----------------------------------------------------------------------------
// Provider streaming calls
//
// Each call function takes (prompt, model, options) where options carries:
//   - responseSchema / temperature / schemaName (per-tool defaults)
//   - onProgress(event)   — called as events arrive. Events are normalized:
//       { kind: "started" }                        — provider began work
//       { kind: "tool_use", tool, target }         — Claude only (e.g. Read)
//       { kind: "text_delta", chars }              — running response length
//       { kind: "done", costUsd?, durationMs? }    — provider signalled end
//   - idleTimeoutMs       — abort if no event for this long
//
// All providers stream so the terminal can show live progress, and an idle
// timeout (rather than wall-clock) means long-but-progressing runs survive.
// -----------------------------------------------------------------------------

const isStructuredOutputUnsupported = (status, errorText) => {
  if (status !== 400) return false;
  return /response_format|json_schema|structured output|not supported/i.test(
    errorText,
  );
};

const buildChatCompletionPayload = (
  prompt,
  model,
  responseSchema,
  temperature,
  schemaName,
  useStructuredOutput,
) => {
  const payload = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature,
    stream: true,
  };

  if (useStructuredOutput) {
    payload.response_format = {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        strict: true,
        schema: responseSchema,
      },
    };
  }

  return payload;
};

// SSE parser: yields each `data:` payload string. Joins continuation lines per
// the SSE spec; skips `[DONE]` sentinel and comments.
async function* parseSseStream(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || "";

      for (const event of events) {
        const dataLines = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"));
        if (!dataLines.length) continue;
        const payload = dataLines
          .map((line) => line.slice(5).replace(/^ /, ""))
          .join("\n")
          .trim();
        if (payload && payload !== "[DONE]") yield payload;
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch (_) {}
  }
}

const reportTextDelta = (onProgress, lastReport, chars) => {
  const now = Date.now();
  if (onProgress && now - lastReport.t > 200) {
    onProgress({ kind: "text_delta", chars });
    lastReport.t = now;
  }
};

// Wraps a streaming call with an idle-timeout watchdog. Returns the result of
// `runner()` or rejects if no progress arrives within `idleTimeoutMs`.
const withIdleTimeout = async (idleTimeoutMs, runner) => {
  if (!idleTimeoutMs || idleTimeoutMs <= 0) return runner({ touch: () => {} });

  let timeoutId;
  let aborted = false;
  const controller = new AbortController();

  const touch = () => {
    if (aborted) return;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      aborted = true;
      controller.abort();
    }, idleTimeoutMs);
  };

  touch();
  try {
    return await runner({ touch, signal: controller.signal });
  } catch (err) {
    if (aborted) {
      throw new Error(
        `provider idle for ${Math.round(idleTimeoutMs / 1000)}s — aborted`,
      );
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

// ---- Claude CLI (spawn + stream-json) ---------------------------------------

// Returns { event, charsDelta } so the caller can maintain a running text
// total across stream_event content_block_delta chunks (only those carry an
// incremental text payload; assistant/final events carry the full text).
const normalizeClaudeEvent = (event, runningChars) => {
  if (event.type === "system" && event.subtype === "init") {
    return { event: { kind: "started" }, charsDelta: 0 };
  }
  if (event.type === "stream_event" && event.event) {
    const inner = event.event;
    if (
      inner.type === "content_block_delta" &&
      inner.delta?.type === "text_delta" &&
      typeof inner.delta.text === "string"
    ) {
      const next = runningChars + inner.delta.text.length;
      return {
        event: { kind: "text_delta", chars: next },
        charsDelta: inner.delta.text.length,
      };
    }
    return { event: null, charsDelta: 0 };
  }
  if (event.type === "assistant" && Array.isArray(event.message?.content)) {
    const toolUse = event.message.content.find((c) => c.type === "tool_use");
    if (toolUse) {
      const input = toolUse.input || {};
      const target = String(
        input.file_path || input.path || input.pattern || input.command || "",
      ).slice(0, 120);
      return {
        event: { kind: "tool_use", tool: toolUse.name, target },
        charsDelta: 0,
      };
    }
    const text = event.message.content.find((c) => c.type === "text");
    if (text && typeof text.text === "string") {
      // If we already streamed partials, prefer the higher of the two; final
      // assistant text may slightly exceed the running tally when partials
      // were rolled up.
      const chars = Math.max(runningChars, text.text.length);
      return { event: { kind: "text_delta", chars }, charsDelta: 0 };
    }
    return { event: null, charsDelta: 0 };
  }
  if (event.type === "result") {
    return {
      event: {
        kind: "done",
        costUsd: event.total_cost_usd,
        durationMs: event.duration_ms,
      },
      charsDelta: 0,
    };
  }
  return { event: null, charsDelta: 0 };
};

const callClaudeCli = (
  prompt,
  model,
  { idleTimeoutMs = 90000, onProgress } = {},
) =>
  new Promise((resolve, reject) => {
    const args = [
      "-p",
      "--model",
      model,
      "--output-format",
      "stream-json",
      "--verbose",
      // Without this, claude CLI emits the assistant message in one chunk at
      // the end — the entire TTFT+generation window is silent and the idle
      // watchdog kills long codemods. Partial messages give us a content_block
      // _delta per few tokens, keeping the watchdog alive and surfacing
      // progress.
      "--include-partial-messages",
    ];
    const child = spawn("claude", args, { stdio: ["pipe", "pipe", "pipe"] });

    let finalResult = null;
    let stderrBuf = "";
    let idleTimer = null;
    let killed = false;
    let runningChars = 0;

    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (idleTimeoutMs > 0) {
        idleTimer = setTimeout(() => {
          killed = true;
          child.kill("SIGTERM");
        }, idleTimeoutMs);
      }
    };
    resetIdle();

    const rl = readline.createInterface({ input: child.stdout });
    rl.on("line", (line) => {
      resetIdle();
      if (!line.trim()) return;
      let event;
      try {
        event = JSON.parse(line);
      } catch (_) {
        return;
      }
      if (event.type === "result" && typeof event.result === "string") {
        finalResult = event.result;
      }
      const { event: norm, charsDelta } = normalizeClaudeEvent(
        event,
        runningChars,
      );
      runningChars += charsDelta;
      if (onProgress && norm) onProgress(norm);
    });

    child.stderr.on("data", (chunk) => {
      stderrBuf += chunk.toString();
    });

    child.on("error", (err) => {
      if (idleTimer) clearTimeout(idleTimer);
      reject(err);
    });

    child.on("close", (code) => {
      if (idleTimer) clearTimeout(idleTimer);
      if (killed) {
        return reject(
          new Error(
            `claude CLI idle for ${Math.round(idleTimeoutMs / 1000)}s — aborted`,
          ),
        );
      }
      if (code !== 0) {
        return reject(
          new Error(
            `claude CLI exited with code ${code}${stderrBuf ? `: ${stderrBuf.slice(0, 300)}` : ""}`,
          ),
        );
      }
      if (!finalResult) {
        return reject(new Error("claude CLI completed without emitting a result"));
      }
      resolve(finalResult);
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });

// ---- Gemini (streamGenerateContent + SSE) -----------------------------------

const callGemini = async (
  prompt,
  model,
  { responseSchema, temperature = 0.3, idleTimeoutMs = 90000, onProgress } = {},
) =>
  withIdleTimeout(idleTimeoutMs, async ({ touch, signal }) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
            responseJsonSchema: responseSchema,
          },
        }),
        signal,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error (${response.status}): ${errorText.slice(0, 200)}`,
      );
    }

    if (onProgress) onProgress({ kind: "started" });

    let accumulated = "";
    const lastReport = { t: 0 };

    for await (const payload of parseSseStream(response.body)) {
      touch();
      try {
        const event = JSON.parse(payload);
        const parts = event.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (typeof part.text === "string") accumulated += part.text;
        }
        reportTextDelta(onProgress, lastReport, accumulated.length);
      } catch (_) {
        // skip malformed chunk
      }
    }

    if (onProgress) {
      onProgress({ kind: "text_delta", chars: accumulated.length });
      onProgress({ kind: "done" });
    }

    if (!accumulated.trim()) {
      throw new Error("Gemini API returned an empty response");
    }
    return accumulated;
  });

// ---- OpenAI-compatible chat completions (OpenAI + OpenRouter) ---------------

const postChatCompletionStream = async (
  endpoint,
  apiKey,
  prompt,
  model,
  {
    responseSchema,
    temperature,
    schemaName,
    sourceLabel,
    idleTimeoutMs = 90000,
    onProgress,
  },
) =>
  withIdleTimeout(idleTimeoutMs, async ({ touch, signal }) => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const send = (useStructured) =>
      fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(
          buildChatCompletionPayload(
            prompt,
            model,
            responseSchema,
            temperature,
            schemaName,
            useStructured,
          ),
        ),
        signal,
      });

    let response = await send(true);
    if (!response.ok) {
      const errorText = await response.text();
      if (isStructuredOutputUnsupported(response.status, errorText)) {
        response = await send(false);
      } else {
        throw new Error(
          `${sourceLabel} error (${response.status}): ${errorText.slice(0, 200)}`,
        );
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `${sourceLabel} error (${response.status}): ${errorText.slice(0, 200)}`,
      );
    }

    if (onProgress) onProgress({ kind: "started" });

    let accumulated = "";
    const lastReport = { t: 0 };

    for await (const payload of parseSseStream(response.body)) {
      touch();
      try {
        const event = JSON.parse(payload);
        const delta = event.choices?.[0]?.delta?.content || "";
        if (delta) {
          accumulated += delta;
          reportTextDelta(onProgress, lastReport, accumulated.length);
        }
      } catch (_) {
        // skip malformed chunk
      }
    }

    if (onProgress) {
      onProgress({ kind: "text_delta", chars: accumulated.length });
      onProgress({ kind: "done" });
    }

    if (!accumulated.trim()) {
      throw new Error(`${sourceLabel} returned an empty response`);
    }
    return accumulated;
  });

const callOpenAi = (
  prompt,
  model,
  {
    responseSchema,
    temperature = 0.3,
    schemaName = "response",
    idleTimeoutMs,
    onProgress,
  } = {},
) =>
  postChatCompletionStream(
    "https://api.openai.com/v1/chat/completions",
    process.env.OPENAI_API_KEY,
    prompt,
    model,
    {
      responseSchema,
      temperature,
      schemaName,
      sourceLabel: "OpenAI API",
      idleTimeoutMs,
      onProgress,
    },
  );

const callOpenRouter = (
  prompt,
  model,
  {
    responseSchema,
    temperature = 0.3,
    schemaName = "response",
    idleTimeoutMs,
    onProgress,
  } = {},
) =>
  postChatCompletionStream(
    "https://openrouter.ai/api/v1/chat/completions",
    process.env.OPENROUTER_API_KEY,
    prompt,
    model,
    {
      responseSchema,
      temperature,
      schemaName,
      sourceLabel: "OpenRouter API",
      idleTimeoutMs,
      onProgress,
    },
  );

// -----------------------------------------------------------------------------
// Progress renderer: turns the normalized event stream into terminal output.
// On a TTY it overwrites a single status line for `text_delta` ticks and
// promotes `tool_use` events to their own line. Falls back to plain lines
// when stdout isn't a TTY (CI, piped output).
// -----------------------------------------------------------------------------

const createProgressRenderer = ({ label } = {}) => {
  const startedAt = Date.now();
  const isTty = !!process.stdout.isTTY;
  let inFlight = false;
  let lastLen = 0;
  let lastNonTtyTick = 0;

  const elapsed = () => `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;

  const clearStatus = () => {
    if (inFlight && isTty) {
      process.stdout.write(`\r${" ".repeat(lastLen + 4)}\r`);
      inFlight = false;
      lastLen = 0;
    }
  };

  const writeStatus = (text) => {
    if (isTty) {
      const padded = text.padEnd(lastLen, " ");
      process.stdout.write(`\r    ${padded}`);
      lastLen = text.length;
      inFlight = true;
    } else if (Date.now() - lastNonTtyTick > 5000) {
      process.stdout.write(`    ${text}\n`);
      lastNonTtyTick = Date.now();
    }
  };

  const writeLine = (text) => {
    clearStatus();
    process.stdout.write(`  ${text}\n`);
  };

  if (label) writeLine(`Generating ${label}...`);

  return {
    onProgress: (event) => {
      if (!event) return;
      if (event.kind === "tool_use") {
        const target = event.target ? ` ${event.target}` : "";
        writeLine(`  ● ${event.tool}${target}`);
      } else if (event.kind === "text_delta") {
        writeStatus(`● receiving · ${event.chars} chars · ${elapsed()}`);
      } else if (event.kind === "started") {
        writeStatus(`● starting · ${elapsed()}`);
      } else if (event.kind === "done") {
        // No-op here — the caller calls finish() once the result is parsed.
      }
    },
    finish: (success, note) => {
      clearStatus();
      const tag = success ? "done!" : "failed.";
      const detail = note ? ` — ${note}` : ` (${elapsed()})`;
      process.stdout.write(`  ${tag}${detail}\n`);
    },
  };
};

// -----------------------------------------------------------------------------
// OpenRouter choice-value helpers (encoded in the inquirer list value so the
// outer model selector can round-trip user picks).
// -----------------------------------------------------------------------------

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

const buildOpenRouterModelChoiceName = (model) => {
  const primaryName =
    typeof model.name === "string" && model.name.trim()
      ? model.name.trim()
      : model.id;
  return `${primaryName} (${model.id})`;
};

let openRouterModelChoicesPromise = null;

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

const getOpenRouterModelChoices = () => {
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

// -----------------------------------------------------------------------------
// createAiProviders — factory that binds the shared plumbing to a tool's
// configuration. Returns an object with the same public surface each tool's
// ai.cjs used to maintain on its own.
// -----------------------------------------------------------------------------

const createAiProviders = ({
  tool,
  responseSchema,
  temperature,
  schemaName,
  idleTimeoutMs,
  manualLabel = "Manual (no AI)",
  manualChoiceLabel = "Manual",
  // Set to false for tools where running without AI is a no-op (e.g. codemod).
  // The picker then offers providers only, and any MANUAL_VALUE we still see
  // (e.g. from missing env config) is the caller's job to treat as an error.
  includeManualOption = true,
}) => {
  if (!tool || !PROVIDER_CATALOG[PROVIDER_CLAUDE_CLI].defaults[tool]) {
    throw new Error(
      `createAiProviders: unknown tool "${tool}". Add defaults under PROVIDER_CATALOG[provider].defaults.${tool}.`,
    );
  }

  const providerInvokers = {
    [PROVIDER_CLAUDE_CLI]: (prompt, model, { onProgress } = {}) =>
      callClaudeCli(prompt, model, { idleTimeoutMs, onProgress }),
    [PROVIDER_GEMINI]: (
      prompt,
      model,
      { responseSchema: schemaOverride, onProgress } = {},
    ) =>
      callGemini(prompt, model, {
        responseSchema: schemaOverride || responseSchema,
        temperature,
        idleTimeoutMs,
        onProgress,
      }),
    [PROVIDER_OPENAI]: (
      prompt,
      model,
      { responseSchema: schemaOverride, onProgress } = {},
    ) =>
      callOpenAi(prompt, model, {
        responseSchema: schemaOverride || responseSchema,
        temperature,
        schemaName,
        idleTimeoutMs,
        onProgress,
      }),
    [PROVIDER_OPENROUTER]: (
      prompt,
      model,
      { responseSchema: schemaOverride, onProgress } = {},
    ) =>
      callOpenRouter(prompt, model, {
        responseSchema: schemaOverride || responseSchema,
        temperature,
        schemaName,
        idleTimeoutMs,
        onProgress,
      }),
  };

  const PROVIDER_DEFS = Object.fromEntries(
    SUPPORTED_PROVIDERS.map((provider) => {
      const catalog = PROVIDER_CATALOG[provider];
      const defaults = catalog.defaults[tool];
      return [
        provider,
        {
          choiceValue: PROVIDER_CHOICE_VALUES[provider],
          defaultSmallModel: defaults.small,
          defaultBigModel: defaults.big,
          envVar: catalog.envVar,
          label: catalog.label,
          invoke: providerInvokers[provider],
        },
      ];
    }),
  );

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

  const getProviderFromChoice = (model) => {
    if (model === MANUAL_VALUE) return null;
    if (isOpenRouterModelChoice(model)) return PROVIDER_OPENROUTER;
    return (
      SUPPORTED_PROVIDERS.find(
        (provider) => PROVIDER_DEFS[provider].choiceValue === model,
      ) || null
    );
  };

  const getDefaultModelChoice = (settings) => {
    if (!settings.defaultProvider) return MANUAL_VALUE;

    if (settings.defaultProvider.provider === PROVIDER_OPENROUTER) {
      const configuredModel =
        settings.defaultProvider.smallModel ||
        settings.defaultProvider.bigModel;
      return configuredModel
        ? encodeOpenRouterModelChoice(configuredModel)
        : OPENROUTER_DIRECT;
    }

    return PROVIDER_DEFS[settings.defaultProvider.provider].choiceValue;
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

  const buildModelChoices = (settings) => {
    const providerChoices = [
      buildProviderChoice(PROVIDER_CLAUDE_CLI, settings),
      buildProviderChoice(PROVIDER_GEMINI, settings),
      buildProviderChoice(PROVIDER_OPENAI, settings),
      buildProviderChoice(PROVIDER_OPENROUTER, settings),
    ];
    return includeManualOption
      ? [{ value: MANUAL_VALUE, name: manualLabel }, ...providerChoices]
      : providerChoices;
  };

  const promptForOpenRouterModel = async (cz, currentModel) => {
    const currentOpenRouterModel = decodeOpenRouterModelChoice(currentModel);
    const choices = await getOpenRouterModelChoices();
    const promptChoices = [
      { value: OPENROUTER_BACK_VALUE, name: "Back" },
      ...choices,
    ];
    const defaultChoice = currentOpenRouterModel
      ? encodeOpenRouterModelChoice(currentOpenRouterModel)
      : promptChoices[1]?.value;
    const defaultIndex = Math.max(
      promptChoices.findIndex((choice) => choice.value === defaultChoice),
      0,
    );
    const answer = await cz.prompt([
      {
        type: "list",
        name: "openRouterModel",
        message: "OpenRouter model:",
        choices: promptChoices,
        default: defaultIndex,
        pageSize: 20,
      },
    ]);

    if (answer.openRouterModel === OPENROUTER_BACK_VALUE) {
      return OPENROUTER_BACK_VALUE;
    }
    return answer.openRouterModel;
  };

  const promptForModel = async (cz, choices, currentModel = MANUAL_VALUE) => {
    const normalizedCurrentModel = isOpenRouterModelChoice(currentModel)
      ? OPENROUTER_DIRECT
      : currentModel;
    const defaultIndex = Math.max(
      choices.findIndex((choice) => choice.value === normalizedCurrentModel),
      0,
    );
    const answer = await cz.prompt([
      {
        type: "list",
        name: "model",
        message: "Model:",
        choices,
        default: defaultIndex,
      },
    ]);

    if (answer.model === OPENROUTER_DIRECT) {
      const selectedOpenRouterModel = await promptForOpenRouterModel(
        cz,
        currentModel,
      );

      if (selectedOpenRouterModel === OPENROUTER_BACK_VALUE) {
        return promptForModel(cz, choices, currentModel);
      }
      return selectedOpenRouterModel;
    }

    return answer.model;
  };

  const getRequiredEnvVar = (model) => {
    const provider = getProviderFromChoice(model);
    return provider ? PROVIDER_DEFS[provider].envVar : null;
  };

  const getModelChoiceLabel = (model) => {
    if (model === MANUAL_VALUE) return manualChoiceLabel;

    const openRouterModel = decodeOpenRouterModelChoice(model);
    if (openRouterModel) return `OpenRouter (${openRouterModel})`;

    const provider = getProviderFromChoice(model);
    return provider ? PROVIDER_DEFS[provider].label : model;
  };

  const getMissingKeyMessage = (model) => {
    const envVar = getRequiredEnvVar(model);
    if (!envVar || process.env[envVar]) return null;
    return `${getModelChoiceLabel(model)} needs \`${envVar}\` before it can run.\n\n  export ${envVar}=your_key_here`;
  };

  const resolveExecutionModel = (model, largeDiff, settings) => {
    const openRouterModel = decodeOpenRouterModelChoice(model);
    if (openRouterModel) return openRouterModel;

    const provider = getProviderFromChoice(model);
    if (!provider) return null;

    const { smallModel, bigModel } = getProviderModels(settings, provider);
    return largeDiff ? bigModel : smallModel;
  };

  const getExecutionModelLabel = (_selectedModel, executionModel) =>
    formatModelVariantLabel(executionModel);

  // `options` may carry { responseSchema, onProgress }. responseSchema overrides
  // the tool default for callers that need a different schema for one prompt
  // (e.g. chunk summaries in cz).
  const invokeProvider = (provider, prompt, model, options = {}) =>
    PROVIDER_DEFS[provider].invoke(prompt, model, options);

  return {
    PROVIDER_DEFS,
    OPENROUTER_BACK_VALUE,
    buildModelChoices,
    buildOpenRouterModelChoiceName,
    decodeOpenRouterModelChoice,
    encodeOpenRouterModelChoice,
    formatModelVariantLabel,
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
  };
};

module.exports = {
  CLAUDE_CLI,
  GEMINI_DIRECT,
  MANUAL_VALUE,
  MAX_BUFFER,
  OPENAI_DIRECT,
  OPENROUTER_BACK_VALUE,
  OPENROUTER_DIRECT,
  PROVIDER_CATALOG,
  PROVIDER_CHOICE_VALUES,
  PROVIDER_CLAUDE_CLI,
  PROVIDER_GEMINI,
  PROVIDER_OPENAI,
  PROVIDER_OPENROUTER,
  SUPPORTED_PROVIDERS,
  createAiProviders,
  createProgressRenderer,
  formatModelVariantLabel,
};
