#!/usr/bin/env node
/* eslint-disable */
/* eslint-disable no-console */
"use strict";

const { runCodemod } = require("./index.cjs");

const parseArgs = (argv) => {
  const opts = { useStaged: false, useUnstaged: false };
  for (const arg of argv) {
    if (arg === "--staged") {
      opts.useStaged = true;
    } else if (arg === "--unstaged") {
      opts.useUnstaged = true;
    } else if (arg === "--help" || arg === "-h") {
      opts.help = true;
    }
  }
  return opts;
};

const printHelp = () => {
  console.log(`
robo-codemod — AI-assisted cross-package sync for filter-builder

Usage:
  pnpm codemod              Detect changes (staged first, fall back to unstaged) and propagate
  pnpm codemod --staged     Only consider staged changes
  pnpm codemod --unstaged   Only consider unstaged changes

Environment variables:
  CODEMOD_PROVIDER    claude-cli | gemini | openai | openrouter
  CODEMOD_SMALL_MODEL Override the default model for small diffs
  CODEMOD_BIG_MODEL   Override the default model for large diffs
  CODEMOD_AUTO=1      Skip prompts (use defaults, apply without confirmation)
  CODEMOD_SKIP=1      Exit immediately without running (useful in pre-commit hook)
  CODEMOD_SOURCE      Force a specific source package (tailwind|mantine|stylex)

Provider API keys:
  OPENAI_API_KEY      Required for openai
  GEMINI_API_KEY      Required for gemini
  OPENROUTER_API_KEY  Required for openrouter
  (claude-cli uses the local \`claude\` binary — no key needed)
`);
};

const main = async () => {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    printHelp();
    return;
  }

  try {
    const result = await runCodemod(opts);
    process.exitCode = result.status === "ai-error" ? 1 : 0;
  } catch (error) {
    console.error(`\n  Codemod failed: ${error.message}\n`);
    process.exitCode = 1;
  }
};

main();
