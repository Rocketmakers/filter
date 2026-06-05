/* eslint-disable */
"use strict";

const {
  DEFAULT_LARGE_DIFF_THRESHOLD,
  SUPPORTED_PROVIDERS,
} = require("./shared.cjs");

const readEnvString = (name) =>
  typeof process.env[name] === "string" ? process.env[name].trim() : "";

const readFirstEnvString = (...names) => {
  for (const name of names) {
    const value = readEnvString(name);
    if (value) {
      return value;
    }
  }
  return "";
};

const parseThreshold = (rawValue) => {
  if (!rawValue) {
    return DEFAULT_LARGE_DIFF_THRESHOLD;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_LARGE_DIFF_THRESHOLD;
};

const resolveDefaultProvider = (warnings) => {
  const provider = readFirstEnvString(
    "CODEMOD_PROVIDER",
    "CZ_AI_PROVIDER",
  ).toLowerCase();
  const smallModel = readFirstEnvString(
    "CODEMOD_SMALL_MODEL",
    "CZ_AI_SMALL_MODEL",
  );
  const bigModel = readFirstEnvString("CODEMOD_BIG_MODEL", "CZ_AI_BIG_MODEL");

  if (!provider) {
    if (smallModel || bigModel) {
      warnings.push(
        "Ignoring CODEMOD_SMALL_MODEL and CODEMOD_BIG_MODEL because CODEMOD_PROVIDER is not set.",
      );
    }

    return null;
  }

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    warnings.push(
      `Ignoring unsupported CODEMOD_PROVIDER "${provider}". Use ${SUPPORTED_PROVIDERS.join(", ")}.`,
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
      readFirstEnvString(
        "CODEMOD_LARGE_DIFF_THRESHOLD",
        "CZ_AI_LARGE_DIFF_THRESHOLD",
      ),
    ),
    skipModelSelection:
      readEnvString("CODEMOD_SKIP_MODEL_SELECTION") === "1" ||
      readEnvString("CZ_AI_SKIP_MODEL_SELECTION") === "1",
    auto: readEnvString("CODEMOD_AUTO") === "1",
    skip: readEnvString("CODEMOD_SKIP") === "1",
    sourceOverride: readEnvString("CODEMOD_SOURCE"),
    warnings,
  };
};

module.exports = {
  resolveSettings,
};
