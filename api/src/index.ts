import { Hono } from "hono"
import { cors } from "hono/cors"
import { createAuth } from "./auth"
import { itemsRoute } from "./routes/items"
import { audioRoute } from "./routes/audio"
import { contextRoute } from "./routes/context"
import { getMigrations } from "better-auth/db/migration"
import { createDb } from "./db"
import { processAutoConfirm } from "./services/pending"

type Bindings = {
  DB: D1Database
  AUDIO_BUCKET: R2Bucket
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  ADMIN_SECRET: string
  USER_TIMEZONE: string
  ITEM_QUEUE: Queue<{ itemId: string }>
}

type Variables = {
  userId: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use("*", async (c, next) => {
  return cors({
    origin: c.env.BETTER_AUTH_URL,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })(c, next)
})

// Block public registration
app.post("/api/auth/sign-up/*", (c) => {
  return c.json({ error: "Registration is disabled." }, 403)
})

// BetterAuth handler
app.all("/api/auth/*", async (c) => {
  const auth = createAuth(c.env.DB, c.env.BETTER_AUTH_SECRET, c.env.BETTER_AUTH_URL)
  return auth.handler(c.req.raw)
})

// One-time migration endpoint (protected by ADMIN_SECRET)
app.post("/api/admin/migrate", async (c) => {
  const secret = c.req.header("x-admin-secret")
  if (!secret || secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: "Forbidden" }, 403)
  }
  const auth = createAuth(c.env.DB, c.env.BETTER_AUTH_SECRET, c.env.BETTER_AUTH_URL)
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options)
  if (toBeCreated.length === 0 && toBeAdded.length === 0) {
    return c.json({ message: "No migrations needed" })
  }
  await runMigrations()
  return c.json({
    message: "Migrations completed",
    created: toBeCreated.map((t) => t.table),
    added: toBeAdded.map((t) => t.table),
  })
})

// One-time seed endpoint (protected by ADMIN_SECRET)
app.post("/api/admin/seed", async (c) => {
  const secret = c.req.header("x-admin-secret")
  if (!secret || secret !== c.env.ADMIN_SECRET) {
    return c.json({ error: "Forbidden" }, 403)
  }
  const { email, password, name } = await c.req.json<{
    email: string
    password: string
    name: string
  }>()
  const auth = createAuth(c.env.DB, c.env.BETTER_AUTH_SECRET, c.env.BETTER_AUTH_URL)
  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  })
  return c.json({ message: "User seeded", userId: result.user.id })
})

// Items CRUD (session-protected inside the route)
app.route("/api/items", itemsRoute)

// Audio upload + R2 serve (session-protected inside the route)
app.route("/api/audio", audioRoute)

// Context (people + projects) management
app.route("/api/context", contextRoute)

app.get("/", (c) => c.text("walkie-talkie api"))

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<{ itemId: string }>, env: Bindings): Promise<void> {
    const db = createDb(env.DB)
    for (const message of batch.messages) {
      await processAutoConfirm(db, message.body.itemId)
      message.ack()
    }
  },
}
