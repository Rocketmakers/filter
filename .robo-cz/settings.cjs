/* eslint-disable */
"use strict";

const {
  DEFAULT_LARGE_COMMIT_CHUNK_DIFF_CHARS,
  DEFAULT_LARGE_COMMIT_CHUNK_SIZE,
  DEFAULT_LARGE_COMMIT_FILE_THRESHOLD,
  DEFAULT_LARGE_DIFF_THRESHOLD,
  SUPPORTED_PROVIDERS,
} = require("./shared.cjs");

const readEnvString = (name) =>
  typeof process.env[name] === "string" ? process.env[name].trim() : "";

const parseThreshold = (rawValue) => {
  if (!rawValue) {
    return DEFAULT_LARGE_DIFF_THRESHOLD;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_LARGE_DIFF_THRESHOLD;
};

const parsePositiveInteger = (rawValue, fallback) => {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveDefaultProvider = (warnings) => {
  const provider = readEnvString("CZ_AI_PROVIDER").toLowerCase();
  const smallModel = readEnvString("CZ_AI_SMALL_MODEL");
  const bigModel = readEnvString("CZ_AI_BIG_MODEL");

  if (!provider) {
    if (smallModel || bigModel) {
      warnings.push(
        "Ignoring CZ_AI_SMALL_MODEL and CZ_AI_BIG_MODEL because CZ_AI_PROVIDER is not set.",
      );
    }

    return null;
  }

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    warnings.push(
      `Ignoring unsupported CZ_AI_PROVIDER "${provider}". Use ${SUPPORTED_PROVIDERS.join(", ")}.`,
    );
    return null;
  }

  return {
    provider,
    smallModel,
    bigModel,
  };
};

const resolveSettings = () => {
  const warnings = [];

  return {
    defaultProvider: resolveDefaultProvider(warnings),
    largeDiffThreshold: parseThreshold(
      readEnvString("CZ_AI_LARGE_DIFF_THRESHOLD"),
    ),
    largeCommitFileThreshold: parsePositiveInteger(
      readEnvString("CZ_AI_LARGE_COMMIT_FILE_THRESHOLD"),
      DEFAULT_LARGE_COMMIT_FILE_THRESHOLD,
    ),
    largeCommitChunkSize: parsePositiveInteger(
      readEnvString("CZ_AI_LARGE_COMMIT_CHUNK_SIZE"),
      DEFAULT_LARGE_COMMIT_CHUNK_SIZE,
    ),
    largeCommitChunkDiffChars: parsePositiveInteger(
      readEnvString("CZ_AI_LARGE_COMMIT_CHUNK_DIFF_CHARS"),
      DEFAULT_LARGE_COMMIT_CHUNK_DIFF_CHARS,
    ),
    skipModelSelection: readEnvString("CZ_AI_SKIP_MODEL_SELECTION") === "1",
    warnings,
  };
};

module.exports = {
  resolveSettings,
};
