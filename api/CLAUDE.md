# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests
npm test

# Run a single test file
npx vitest run src/tests/audio-upload.test.ts

# Deploy to Cloudflare Workers
npm run deploy

# Regenerate Cloudflare bindings types (after changing wrangler.jsonc)
npm run cf-typegen

# Generate a Drizzle migration after changing src/db/schema.ts
npx drizzle-kit generate

# Apply migrations to local D1
npm run migrate:local

# Apply migrations to remote D1
npm run migrate:remote

# Seed a user (local)
npm run seed:local
```

Tests run inside `@cloudflare/vitest-pool-workers` — they execute in a Workers runtime, not Node, so Cloudflare globals (`D1Database`, `R2Bucket`, etc.) are available without mocking.

## Architecture

The API is a single **Hono** app deployed as a **Cloudflare Worker** (`src/index.ts`). It exposes four route groups:

| Mount | File | Description |
|---|---|---|
| `/api/auth/*` | `src/auth.ts` | BetterAuth (email+password). Public registration is disabled; users are seeded via `POST /api/admin/seed`. |
| `/api/items` | `src/routes/items.ts` | CRUD for captured items. Only `confirmed` items are returned by `GET /`. |
| `/api/audio` | `src/routes/audio.ts` | Audio upload pipeline + R2 serving. |
| `/api/context` | `src/routes/context.ts` | Context people and projects CRUD. |

### Audio upload pipeline (`POST /api/audio/upload`)

1. Validate file: MIME must start with `audio/`, size ≤ 25 MB, WebM magic bytes checked for `audio/webm`.
2. Store raw audio to R2 at key `{userId}/{cuid}.webm`.
3. Transcribe with Workers AI `@cf/openai/whisper-large-v3-turbo` (language: `pt`).
4. Classify transcript with Workers AI `@cf/moonshotai/kimi-k2.5` (JSON mode). Active context people/projects are fetched and passed as hints.
5. Keyword override: if transcript contains "backlog", `category` is forced to `backlog` regardless of LLM output.
6. Insert item to D1 as `status: "pending"`.
7. If `confidence >= 0.8`, enqueue to `item-auto-confirm` queue with a 5-second delay. The queue consumer (`src/services/pending.ts`) sets `status: "confirmed"`.

### Authentication & authorization

Every protected route installs `sessionMiddleware` (defined in `src/middleware/session.ts`), which calls BetterAuth's `getSession` and sets `userId` in Hono context. Every DB query includes `eq(items.userId, userId)` to enforce user isolation. R2 paths embed `userId` so the URL itself enforces ownership.

### Database (Drizzle + D1)

Schema lives in `src/db/schema.ts`. Tables:
- `items` — core capture records (type enum: `reminder | note | bill | idea | shopping | journal | backlog`)
- `contextPeople` — named people that get auto-linked to items when their name appears in the transcript
- `contextProjects` — named projects for backlog grouping
- `itemPeople` — many-to-many join between items and people

After editing `schema.ts`, run `npx drizzle-kit generate` to produce a migration SQL file in `drizzle/`, then apply with `npm run migrate:local`.

### Shared schemas

Zod schemas in `../shared/src/schemas/` are published as the `@walkie-talkie/shared` workspace package and imported by both this API and the frontend. Never define a schema in two places — add it to `shared/` and import from there.
