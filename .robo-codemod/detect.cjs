/* eslint-disable */
"use strict";

const { execFileSync } = require("child_process");

const {
  MAX_BUFFER,
  PACKAGE_NAMES,
  PACKAGE_ROOTS,
  SYNC_PATHS,
} = require("./shared.cjs");

const runGit = (args) =>
  execFileSync("git", args, {
    encoding: "utf-8",
    maxBuffer: MAX_BUFFER,
  });

const getStagedFiles = () => {
  const output = runGit([
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
  ]).trim();

  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

const getUnstagedFiles = () => {
  const output = runGit([
    "diff",
    "--name-only",
    "--diff-filter=ACMR",
  ]).trim();

  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

const fileBelongsToPackage = (file, packageName) => {
  const root = PACKAGE_ROOTS[packageName];
  if (!root) {
    return false;
  }
  return file === root || file.startsWith(`${root}/`);
};

const fileMatchesSyncPath = (file, packageName) => {
  const root = PACKAGE_ROOTS[packageName];
  if (!root) {
    return false;
  }

  if (!SYNC_PATHS.length) {
    return fileBelongsToPackage(file, packageName);
  }

  return SYNC_PATHS.some((syncPath) =>
    file.startsWith(`${root}/${syncPath}`),
  );
};

const groupFilesByPackage = (files) => {
  const grouped = Object.fromEntries(PACKAGE_NAMES.map((name) => [name, []]));

  for (const file of files) {
    for (const name of PACKAGE_NAMES) {
      if (fileBelongsToPackage(file, name)) {
        grouped[name].push(file);
        break;
      }
    }
  }

  return grouped;
};

const detectChangedPackages = (files) => {
  const grouped = groupFilesByPackage(files);
  return PACKAGE_NAMES.filter((name) => grouped[name].length > 0);
};

const detectSyncableChange = (files) => {
  const grouped = groupFilesByPackage(files);
  const changedPackages = PACKAGE_NAMES.filter((name) =>
    grouped[name].some((file) => fileMatchesSyncPath(file, name)),
  );

  return {
    grouped,
    changedPackages,
  };
};

const relativeToPackageSync = (file, packageName) => {
  const root = PACKAGE_ROOTS[packageName];
  if (!root) {
    return null;
  }
  const prefix = `${root}/`;
  if (!file.startsWith(prefix)) {
    return null;
  }
  return file.slice(prefix.length);
};

const getStagedFileContent = (file) => {
  try {
    return runGit(["show", `:${file}`]);
  } catch {
    return null;
  }
};

const getStagedDiffForFiles = (files, maxChars) => {
  if (!Array.isArray(files) || files.length === 0) {
    return "";
  }

  let diff = runGit(["diff", "--cached", "--", ...files]);

  if (typeof maxChars === "number" && diff.length > maxChars) {
    const lineEnd = diff.lastIndexOf("\n", maxChars);
    diff = `${diff.slice(0, lineEnd > 0 ? lineEnd : maxChars)}\n\n... (diff truncated for brevity)`;
  }

  return diff;
};

const getStagedStatForFiles = (files) => {
  if (!Array.isArray(files) || files.length === 0) {
    return "";
  }

  return runGit(["diff", "--cached", "--stat", "--", ...files]).trim();
};

module.exports = {
  detectChangedPackages,
  detectSyncableChange,
  fileBelongsToPackage,
  fileMatchesSyncPath,
  getStagedDiffForFiles,
  getStagedFileContent,
  getStagedFiles,
  getStagedStatForFiles,
  getUnstagedFiles,
  groupFilesByPackage,
  relativeToPackageSync,
};
