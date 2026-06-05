/* eslint-disable */
"use strict";

const { existsSync } = require("fs");
const { resolve } = require("path");

const DEFAULT_CONFIG = {
  packages: [
    {
      name: "tailwind",
      root: "packages/tailwind",
      stack: "Tailwind v4 + Radix + cmdk + shadcn-style components",
    },
    {
      name: "mantine",
      root: "packages/mantine",
      stack: "Mantine v8 + SCSS modules (.module.scss)",
    },
    {
      name: "stylex",
      root: "packages/stylex",
      stack: "StyleX + Radix + cmdk",
    },
  ],
  syncPaths: ["src/components/ui/filter-builder"],
};

const loadConfig = () => {
  const candidates = [
    resolve(__dirname, "../.codemod-config.cjs"),
    resolve(__dirname, "../.codemod-config.js"),
  ];

  for (const candidate of candidates) {
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
      throw error;
    }
  }

  return {};
};

const userConfig = loadConfig();

const PACKAGES = Array.isArray(userConfig.packages)
  ? userConfig.packages
  : DEFAULT_CONFIG.packages;

const SYNC_PATHS = Array.isArray(userConfig.syncPaths)
  ? userConfig.syncPaths
  : DEFAULT_CONFIG.syncPaths;

const PACKAGE_NAMES = PACKAGES.map((p) => p.name);
const PACKAGE_ROOTS = Object.fromEntries(PACKAGES.map((p) => [p.name, p.root]));
const PACKAGE_STACKS = Object.fromEntries(
  PACKAGES.map((p) => [p.name, p.stack]),
);

const MAX_BUFFER = 1024 * 1024 * 20;
const MAX_DIFF_CHARS = 24000;
const MAX_FILE_CHARS = 16000;
const DEFAULT_LARGE_DIFF_THRESHOLD = 6000;

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

const CODEMOD_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    rationale: { type: "string" },
    changes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          package: { type: "string" },
          path: { type: "string" },
          action: { type: "string", enum: ["write", "delete"] },
          content: { type: "string" },
        },
        required: ["package", "path", "action", "content"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "rationale", "changes"],
  additionalProperties: false,
};

module.exports = {
  CLAUDE_CLI,
  CODEMOD_JSON_SCHEMA,
  DEFAULT_LARGE_DIFF_THRESHOLD,
  GEMINI_DIRECT,
  MANUAL_VALUE,
  MAX_BUFFER,
  MAX_DIFF_CHARS,
  MAX_FILE_CHARS,
  OPENAI_DIRECT,
  OPENROUTER_DIRECT,
  PACKAGES,
  PACKAGE_NAMES,
  PACKAGE_ROOTS,
  PACKAGE_STACKS,
  PROVIDER_CLAUDE_CLI,
  PROVIDER_GEMINI,
  PROVIDER_OPENAI,
  PROVIDER_OPENROUTER,
  SUPPORTED_PROVIDERS,
  SYNC_PATHS,
};
