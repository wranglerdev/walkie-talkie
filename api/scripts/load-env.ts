import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const devVarsPath = join(dirname(fileURLToPath(import.meta.url)), "../.dev.vars");

if (existsSync(devVarsPath)) {
  for (const line of readFileSync(devVarsPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    process.env[key] ??= value;
  }
}
