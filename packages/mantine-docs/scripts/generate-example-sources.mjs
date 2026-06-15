import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_ROOT = join(
  __dirname,
  "..",
  "..",
  "demo-code",
  "src",
  "integrations",
  "examples",
);
const OUT_FILE = join(
  __dirname,
  "..",
  "components",
  "integrations",
  "example-sources.generated.ts",
);
const KEY_PREFIX = "@filter-builder/demo-code/integrations/examples/";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(EXAMPLES_ROOT).sort();
const entries = files.map((full) => {
  const rel = relative(EXAMPLES_ROOT, full).split(/[\\/]/).join("/");
  const key = `${KEY_PREFIX}${rel}`;
  const source = readFileSync(full, "utf8");
  return [key, source];
});

const body = entries
  .map(([key, source]) => `  ${JSON.stringify(key)}: ${JSON.stringify(source)},`)
  .join("\n");

const output = `export const exampleSources: Record<string, string> = {\n${body}\n};\n`;

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, output, "utf8");

console.log(`Wrote ${entries.length} example sources to ${relative(process.cwd(), OUT_FILE)}`);
