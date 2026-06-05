#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { argv, cwd as processCwd, exit, stderr, stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

type Variant = "mantine" | "stylex";
type PackageManager = "pnpm" | "yarn" | "bun" | "npm";

type RegistryFile = {
  path: string;
  target?: string;
  type: string;
  content: string;
};

type Registry = {
  name: string;
  title?: string;
  dependencies?: string[];
  devDependencies?: string[];
  files: RegistryFile[];
};

const REGISTRY_BASE = process.env.FILTER_CLI_REGISTRY_BASE ?? "https://rocketmakers.github.io/filter/r";
const VARIANTS: readonly Variant[] = ["mantine", "stylex"] as const;

const c = {
  bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[22m`,
  red: (s: string) => `\x1b[31m${s}\x1b[39m`,
  green: (s: string) => `\x1b[32m${s}\x1b[39m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[39m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[39m`,
};

function printHelp(): void {
  stdout.write(`
${c.bold("@rocketmakers/filter")} — drop FilterBuilder into your app

${c.bold("Usage")}
  npx @rocketmakers/filter <variant> [options]

${c.bold("Variants")}
  mantine    Mantine v8 + SCSS modules
  stylex     StyleX + Radix + cmdk

${c.bold("Options")}
  --cwd <dir>     Target project directory (default: current directory)
  --no-install    Skip installing npm dependencies
  --force         Overwrite existing files without prompting
  --help, -h      Show this message

${c.bold("Examples")}
  npx @rocketmakers/filter mantine
  npx @rocketmakers/filter stylex --cwd ./apps/web

${c.dim("Tailwind users: use the shadcn registry instead — see")} ${c.cyan("https://github.com/Rocketmakers/filter")}
`);
}

function parseArgs(args: string[]): {
  variant: Variant | null;
  cwd: string;
  install: boolean;
  force: boolean;
  help: boolean;
} {
  let variant: Variant | null = null;
  let cwd = processCwd();
  let install = true;
  let force = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") help = true;
    else if (arg === "--no-install") install = false;
    else if (arg === "--force") force = true;
    else if (arg === "--cwd") {
      const next = args[++i];
      if (!next) throw new Error("--cwd requires a path");
      cwd = resolve(next);
    } else if ((VARIANTS as readonly string[]).includes(arg)) {
      variant = arg as Variant;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      throw new Error(`Unknown argument: ${arg}. Variants: ${VARIANTS.join(", ")}`);
    }
  }

  return { variant, cwd, install, force, help };
}

async function promptVariant(): Promise<Variant> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    while (true) {
      const answer = (await rl.question(`${c.bold("Which variant?")} (${VARIANTS.join(" / ")}) `)).trim().toLowerCase();
      if ((VARIANTS as readonly string[]).includes(answer)) return answer as Variant;
      stdout.write(c.yellow(`Please enter one of: ${VARIANTS.join(", ")}\n`));
    }
  } finally {
    rl.close();
  }
}

async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question(`${message} (y/N) `)).trim().toLowerCase();
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

async function fetchRegistry(variant: Variant): Promise<Registry> {
  const url = `${REGISTRY_BASE}/filter-builder-${variant}.json`;
  stdout.write(`${c.dim(`> fetching ${url}`)}\n`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch registry: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as Registry;
}

function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(join(cwd, "bun.lock")) || existsSync(join(cwd, "bun.lockb"))) return "bun";
  return "npm";
}

function resolveTarget(target: string | undefined, fallback: string, cwd: string): string {
  const t = target ?? fallback;
  const rel = t.startsWith("~/") ? t.slice(2) : t;
  return join(cwd, "src", rel);
}

async function writeFiles(
  files: RegistryFile[],
  cwd: string,
  force: boolean,
): Promise<{ written: number; skipped: number }> {
  let written = 0;
  let skipped = 0;

  for (const file of files) {
    const dest = resolveTarget(file.target, file.path, cwd);

    if (existsSync(dest) && !force) {
      const ok = await confirm(`${c.yellow("exists:")} ${relativeTo(cwd, dest)} — overwrite?`);
      if (!ok) {
        stdout.write(`${c.dim(`  skipped ${relativeTo(cwd, dest)}`)}\n`);
        skipped++;
        continue;
      }
    }

    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, file.content, "utf8");
    stdout.write(`${c.green("  wrote")} ${relativeTo(cwd, dest)}\n`);
    written++;
  }

  return { written, skipped };
}

function relativeTo(cwd: string, abs: string): string {
  if (abs.startsWith(cwd)) {
    const trimmed = abs.slice(cwd.length);
    return trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  }
  return abs;
}

function installCommand(pm: PackageManager, deps: string[], dev: boolean): string[] {
  switch (pm) {
    case "pnpm":
      return ["pnpm", "add", ...(dev ? ["-D"] : []), ...deps];
    case "yarn":
      return ["yarn", "add", ...(dev ? ["-D"] : []), ...deps];
    case "bun":
      return ["bun", "add", ...(dev ? ["-d"] : []), ...deps];
    case "npm":
    default:
      return ["npm", "install", ...(dev ? ["-D"] : []), ...deps];
  }
}

function runCommand(cmd: string[], cwd: string): Promise<void> {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(cmd[0], cmd.slice(1), { cwd, stdio: "inherit" });
    child.on("error", rejectP);
    child.on("exit", (code) => {
      if (code === 0) resolveP();
      else rejectP(new Error(`${cmd[0]} exited with code ${code}`));
    });
  });
}

async function installDeps(
  pm: PackageManager,
  deps: string[],
  devDeps: string[],
  cwd: string,
): Promise<void> {
  if (deps.length > 0) {
    stdout.write(`\n${c.bold(`Installing ${deps.length} dependencies with ${pm}…`)}\n`);
    await runCommand(installCommand(pm, deps, false), cwd);
  }
  if (devDeps.length > 0) {
    stdout.write(`\n${c.bold(`Installing ${devDeps.length} devDependencies with ${pm}…`)}\n`);
    await runCommand(installCommand(pm, devDeps, true), cwd);
  }
}

const PROVIDER_SNIPPETS: Record<Variant, string> = {
  mantine: `import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./theme/globals.scss";

import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import { mantineTheme } from "./theme/mantineTheme";

<MantineProvider theme={mantineTheme} defaultColorScheme="auto">
  <DatesProvider settings={{ locale: "en-gb" }}>
    <Notifications position="top-right" />
    {/* your app */}
  </DatesProvider>
</MantineProvider>`,
  stylex: `import { ThemeProvider } from "./lib/theme";

<ThemeProvider>
  {/* your app */}
</ThemeProvider>

// Also: wire @stylexjs/unplugin into your bundler (Vite/Next/etc.)
// so the StyleX rules compile. See: https://stylexjs.com/docs/learn/installation/`,
};

function printNextSteps(variant: Variant, cwd: string): void {
  stdout.write(`\n${c.bold(c.green("✓ Done."))} Files written under ${c.cyan(relativeTo(processCwd(), join(cwd, "src")))}/.\n\n`);
  stdout.write(`${c.bold("Next:")} mount the providers at your app root.\n\n`);
  stdout.write(PROVIDER_SNIPPETS[variant] + "\n\n");
  stdout.write(`${c.dim("Reference setup: ")}${c.cyan(`https://github.com/Rocketmakers/filter/blob/main/packages/${variant}/src/main.tsx`)}\n`);
}

async function main(): Promise<void> {
  let parsed;
  try {
    parsed = parseArgs(argv.slice(2));
  } catch (err) {
    stderr.write(c.red(`Error: ${(err as Error).message}\n\n`));
    printHelp();
    exit(1);
  }

  if (parsed.help) {
    printHelp();
    return;
  }

  if (!existsSync(join(parsed.cwd, "package.json"))) {
    stderr.write(c.red(`Error: no package.json found at ${parsed.cwd}.\n`));
    stderr.write(`Run this from your project root, or pass ${c.bold("--cwd <dir>")}.\n`);
    exit(1);
  }

  const variant = parsed.variant ?? (await promptVariant());

  const registry = await fetchRegistry(variant);

  stdout.write(`\n${c.bold(`Writing ${registry.files.length} files`)} into ${c.cyan(relativeTo(processCwd(), join(parsed.cwd, "src")))}/\n`);
  const { written, skipped } = await writeFiles(registry.files, parsed.cwd, parsed.force);
  stdout.write(`${c.dim(`(${written} written, ${skipped} skipped)`)}\n`);

  if (parsed.install) {
    const pm = detectPackageManager(parsed.cwd);
    await installDeps(pm, registry.dependencies ?? [], registry.devDependencies ?? [], parsed.cwd);
  } else {
    stdout.write(`\n${c.yellow("Skipped install.")} Install these manually:\n`);
    if (registry.dependencies?.length) stdout.write(`  deps:    ${registry.dependencies.join(" ")}\n`);
    if (registry.devDependencies?.length) stdout.write(`  devDeps: ${registry.devDependencies.join(" ")}\n`);
  }

  printNextSteps(variant, parsed.cwd);
}

main().catch((err) => {
  stderr.write(c.red(`\nError: ${(err as Error).message}\n`));
  exit(1);
});
