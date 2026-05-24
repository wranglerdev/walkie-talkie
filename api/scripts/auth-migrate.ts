import "./load-env.ts";

const target = process.argv[2];

if (target !== "--local" && target !== "--remote") {
  console.error("Usage: auth-migrate.ts --local | --remote");
  process.exit(1);
}

const baseUrl =
  target === "--local"
    ? "http://localhost:8787"
    : process.env.BETTER_AUTH_URL ?? (() => { throw new Error("BETTER_AUTH_URL env var is required for --remote"); })();

const adminSecret = process.env.ADMIN_SECRET;
if (!adminSecret) {
  console.error("ADMIN_SECRET env var is required");
  process.exit(1);
}

console.log(`Running auth migration against ${baseUrl}...`);
const res = await fetch(`${baseUrl}/api/admin/migrate`, {
  method: "POST",
  headers: { "x-admin-secret": adminSecret },
});

const body = await res.json();
console.log(JSON.stringify(body, null, 2));

if (!res.ok) {
  console.error(`Failed with status ${res.status}`);
  process.exit(1);
}
console.log("Done.");
