/* eslint-disable */
"use strict";

const { existsSync } = require("fs");
const { resolve } = require("path");

const DEFAULT_COMMIT_CONFIG = {
  allowCustomScopes: true,
  defaultType: "chore",
  scopes: [],
  subjectLimit: 100,
  types: [
    {
      name: "feat",
      description: "A new feature",
      aiHint: "a new feature or capability",
      allowBreakingChanges: true,
    },
    {
      name: "fix",
      description: "A bug fix",
      aiHint: "a bug fix",
      allowBreakingChanges: true,
    },
    {
      name: "docs",
      description: "Documentation only changes",
      aiHint: "documentation updates",
    },
    {
      name: "style",
      description: "Code style changes (no functionality change)",
      aiHint: "code style or formatting changes",
    },
    {
      name: "refactor",
      description: "Code refactoring",
      aiHint: "a code refactor or restructuring",
      allowBreakingChanges: true,
    },
    {
      name: "perf",
      description: "Performance improvements",
      aiHint: "a performance improvement",
    },
    {
      name: "test",
      description: "Adding or updating tests",
      aiHint: "adding or updating tests",
    },
    {
      name: "chore",
      description: "Build, tooling, dependencies",
      aiHint: "dependency updates or build configuration",
    },
    {
      name: "ci",
      description: "CI/CD configuration",
      aiHint: "CI/CD pipeline or configuration changes",
    },
  ],
};

const loadConfig = () => {
  const configCandidates = [
    resolve(__dirname, "../.commit-config.cjs"),
    resolve(__dirname, "../.commit-config.js"),
  ];

  for (const candidate of configCandidates) {
    if (!existsSync(candidate)) {
      continue;
    }

    try {
      return require(candidate) || {};
    } catch (error) {
      if (
        candidate.endsWith(".js") &&
        error &&
        error.code === "ERR_REQUIRE_ESM"
      ) {
        continue;
      }
    }
  }

  return {};
};

const config = loadConfig();

const normalizeScope = (scope) => {
  if (typeof scope === "string") {
    return { name: scope };
  }

  return scope && typeof scope.name === "string"
    ? { name: scope.name }
    : { name: "" };
};

const normalizeType = (type, breakingTypes = new Set()) => {
  const value =
    typeof type?.value === "string" && type.value.trim()
      ? type.value.trim()
      : typeof type?.name === "string" && type.name.trim()
        ? type.name.trim()
        : typeof type === "string"
          ? type.trim()
          : "";

  if (!value) {
    return null;
  }

  const description =
    typeof type?.description === "string" && type.description.trim()
      ? type.description.trim()
      : value;
  const aiHint =
    typeof type?.aiHint === "string" && type.aiHint.trim()
      ? type.aiHint.trim()
      : description.charAt(0).toLowerCase() + description.slice(1);

  return {
    name: value,
    description,
    aiHint,
    allowBreakingChanges:
      type?.allowBreakingChanges === true || breakingTypes.has(value),
  };
};

const buildFallbackCommitizenType = (type) => ({
  value: type.name,
  name: `${type.name} : ${type.description || type.name}`,
});

const resolveCommitConfig = () => {
  if (config.commitConfig && Array.isArray(config.commitConfig.types)) {
    return {
      allowCustomScopes: config.commitConfig.allowCustomScopes === true,
      defaultType:
        typeof config.commitConfig.defaultType === "string"
          ? config.commitConfig.defaultType.trim()
          : "",
      scopes: Array.isArray(config.commitConfig.scopes)
        ? config.commitConfig.scopes.map(normalizeScope)
        : [],
      subjectLimit:
        Number.isInteger(config.commitConfig.subjectLimit) &&
        config.commitConfig.subjectLimit > 0
          ? config.commitConfig.subjectLimit
          : DEFAULT_COMMIT_CONFIG.subjectLimit,
      types: config.commitConfig.types
        .map((type) =>
          normalizeType(
            type,
            new Set(config.commitConfig.allowBreakingChanges || []),
          ),
        )
        .filter(Boolean),
    };
  }

  const { czCustomizable = {} } = config;
  const breakingTypes = new Set(czCustomizable.allowBreakingChanges || []);

  return {
    allowCustomScopes:
      typeof czCustomizable.allowCustomScopes === "boolean"
        ? czCustomizable.allowCustomScopes
        : DEFAULT_COMMIT_CONFIG.allowCustomScopes,
    defaultType: DEFAULT_COMMIT_CONFIG.defaultType,
    scopes: Array.isArray(czCustomizable.scopes)
      ? czCustomizable.scopes.map(normalizeScope)
      : DEFAULT_COMMIT_CONFIG.scopes,
    subjectLimit:
      czCustomizable.subjectLimit || DEFAULT_COMMIT_CONFIG.subjectLimit,
    types: Array.isArray(czCustomizable.types)
      ? czCustomizable.types
          .map((type) => normalizeType(type, breakingTypes))
          .filter(Boolean)
      : DEFAULT_COMMIT_CONFIG.types
          .map((type) => normalizeType(type))
          .filter(Boolean),
  };
};

const COMMIT_CONFIG = resolveCommitConfig();
const { czCustomizable = {} } = config;
const TYPES = Array.isArray(czCustomizable.types)
  ? czCustomizable.types
  : COMMIT_CONFIG.types.map(buildFallbackCommitizenType);
const VALID_TYPES = COMMIT_CONFIG.types.map((type) => type.name);
const SCOPES = Array.isArray(czCustomizable.scopes)
  ? czCustomizable.scopes.map(normalizeScope)
  : COMMIT_CONFIG.scopes;
const SCOPE_NAMES = COMMIT_CONFIG.scopes
  .map((scope) => scope.name)
  .filter(Boolean);
const DEFAULT_TYPE = VALID_TYPES.includes(COMMIT_CONFIG.defaultType)
  ? COMMIT_CONFIG.defaultType
  : VALID_TYPES.includes("chore")
    ? "chore"
    : VALID_TYPES[0];
const SUBJECT_LIMIT = COMMIT_CONFIG.subjectLimit;
const MAX_BUFFER = 1024 * 1024 * 20;
const MAX_DIFF_CHARS = 12000;
const DEFAULT_LARGE_DIFF_THRESHOLD = 4000;
const DEFAULT_LARGE_COMMIT_FILE_THRESHOLD = 40;
const DEFAULT_LARGE_COMMIT_CHUNK_SIZE = 25;
const DEFAULT_LARGE_COMMIT_CHUNK_DIFF_CHARS = 6000;
const ALLOW_CUSTOM_SCOPES = COMMIT_CONFIG.allowCustomScopes;
const BREAKING_CHANGE_TYPES = new Set(
  COMMIT_CONFIG.types
    .filter((type) => type.allowBreakingChanges)
    .map((type) => type.name),
);

const NO_SCOPE = "(none)";
const CUSTOM_SCOPE = "(custom)";

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

const TYPE_GUIDANCE = Object.fromEntries(
  COMMIT_CONFIG.types.map((type) => [type.name, type.aiHint]),
);

const COMMIT_JSON_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string" },
    scope: { type: "string" },
    subject: { type: "string" },
    body: { type: "string" },
    breaking: { type: "string" },
  },
  required: ["type", "scope", "subject", "body", "breaking"],
  additionalProperties: false,
};

const CHUNK_SUMMARY_JSON_SCHEMA = {
  type: "object",
  properties: {
    chunkSummary: { type: "string" },
    keyAreas: {
      type: "array",
      items: { type: "string" },
    },
    riskFlags: {
      type: "array",
      items: { type: "string" },
    },
    breakingSignals: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["chunkSummary", "keyAreas", "riskFlags", "breakingSignals"],
  additionalProperties: false,
};

const supportsBreakingChanges = (type) => BREAKING_CHANGE_TYPES.has(type);

module.exports = {
  ALLOW_CUSTOM_SCOPES,
  CHUNK_SUMMARY_JSON_SCHEMA,
  CLAUDE_CLI,
  COMMIT_JSON_SCHEMA,
  CUSTOM_SCOPE,
  DEFAULT_LARGE_COMMIT_CHUNK_DIFF_CHARS,
  DEFAULT_LARGE_COMMIT_CHUNK_SIZE,
  DEFAULT_LARGE_COMMIT_FILE_THRESHOLD,
  DEFAULT_LARGE_DIFF_THRESHOLD,
  DEFAULT_TYPE,
  GEMINI_DIRECT,
  MANUAL_VALUE,
  MAX_BUFFER,
  MAX_DIFF_CHARS,
  NO_SCOPE,
  OPENAI_DIRECT,
  OPENROUTER_DIRECT,
  PROVIDER_CLAUDE_CLI,
  PROVIDER_GEMINI,
  PROVIDER_OPENAI,
  PROVIDER_OPENROUTER,
  SCOPES,
  SCOPE_NAMES,
  SUBJECT_LIMIT,
  SUPPORTED_PROVIDERS,
  TYPES,
  TYPE_GUIDANCE,
  VALID_TYPES,
  COMMIT_CONFIG,
  czCustomizable,
  supportsBreakingChanges,
};
