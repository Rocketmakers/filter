/* eslint-disable */
/* eslint-disable no-console */
"use strict";

const { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require("fs");
const { dirname, resolve } = require("path");

const { PACKAGE_NAMES, PACKAGE_ROOTS } = require("./shared.cjs");

const REPO_ROOT = resolve(__dirname, "..");

const isPathInsidePackage = (filePath, packageName) => {
  const root = PACKAGE_ROOTS[packageName];
  if (!root) {
    return false;
  }
  return filePath === root || filePath.startsWith(`${root}/`);
};

const validateChange = (change, allowedPackages) => {
  if (!change || typeof change !== "object") {
    return "Change is not an object.";
  }
  if (!PACKAGE_NAMES.includes(change.package)) {
    return `Unknown package "${change.package}". Allowed: ${PACKAGE_NAMES.join(", ")}.`;
  }
  if (!allowedPackages.includes(change.package)) {
    return `Package "${change.package}" is not in the allowed target list (${allowedPackages.join(", ")}).`;
  }
  if (typeof change.path !== "string" || !change.path) {
    return "Change is missing a path.";
  }
  if (change.path.includes("..") || change.path.startsWith("/")) {
    return `Path "${change.path}" must be a relative repo path without ".." segments.`;
  }
  if (!isPathInsidePackage(change.path, change.package)) {
    return `Path "${change.path}" is not inside package "${change.package}" (${PACKAGE_ROOTS[change.package]}).`;
  }
  if (change.action !== "write" && change.action !== "delete") {
    return `Unknown action "${change.action}". Use "write" or "delete".`;
  }
  if (change.action === "write" && typeof change.content !== "string") {
    return "Write action must include string content.";
  }
  return null;
};

const validateChanges = (changes, allowedPackages) => {
  const errors = [];
  for (const change of changes) {
    const error = validateChange(change, allowedPackages);
    if (error) {
      errors.push(error);
    }
  }
  return errors;
};

const summarizeChange = (change) => {
  if (change.action === "delete") {
    return `delete ${change.path}`;
  }
  const exists = existsSync(resolve(REPO_ROOT, change.path));
  return exists
    ? `update ${change.path}`
    : `create ${change.path}`;
};

const summarizeChanges = (changes) => {
  if (!changes.length) {
    return "  (no file changes proposed)";
  }
  const byPackage = {};
  for (const change of changes) {
    byPackage[change.package] = byPackage[change.package] || [];
    byPackage[change.package].push(`  - ${summarizeChange(change)}`);
  }
  return Object.entries(byPackage)
    .map(([pkg, lines]) => `  ${pkg}:\n${lines.join("\n")}`)
    .join("\n\n");
};

const applyChanges = (changes) => {
  const applied = [];
  for (const change of changes) {
    const fullPath = resolve(REPO_ROOT, change.path);

    if (change.action === "delete") {
      if (existsSync(fullPath)) {
        rmSync(fullPath, { force: true });
      }
      applied.push({ ...change, applied: "deleted" });
      continue;
    }

    const previous = existsSync(fullPath)
      ? readFileSync(fullPath, "utf-8")
      : null;

    if (previous === change.content) {
      applied.push({ ...change, applied: "unchanged" });
      continue;
    }

    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, change.content, "utf-8");
    applied.push({
      ...change,
      applied: previous == null ? "created" : "updated",
    });
  }
  return applied;
};

module.exports = {
  applyChanges,
  summarizeChange,
  summarizeChanges,
  validateChanges,
};
