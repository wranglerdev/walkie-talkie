import "./load-env.ts";
import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DB_NAME = "walkie-talkie-db";
const target = process.argv[2];

if (target !== "--local" && target !== "--remote") {
  console.error("Usage: db-migrate.ts --local | --remote");
  process.exit(1);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "../drizzle");

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => join(migrationsDir, f));

if (files.length === 0) {
  console.error(`No migration files found in ${migrationsDir}`);
  process.exit(1);
}

const ALREADY_APPLIED_PATTERNS = [
  /duplicate column name/i,
  /table .* already exists/i,
  /index .* already exists/i,
];

const cwd = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log(`Running ${files.length} migration(s) ${target}...`);
for (const file of files) {
  const name = file.split("/").at(-1);
  try {
    execSync(`npx wrangler d1 execute ${DB_NAME} ${target} --file "${file}"`, {
      stdio: ["inherit", "inherit", "pipe"],
      cwd,
    });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    const stderr = (err as { stderr?: Buffer }).stderr?.toString() ?? "";
    if (ALREADY_APPLIED_PATTERNS.some((p) => p.test(stderr))) {
      console.log(`  ⚠ ${name} (already applied, skipping)`);
    } else {
      console.error(stderr);
      process.exit(1);
    }
  }
}
console.log("Done.");
