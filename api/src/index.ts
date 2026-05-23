import { Hono } from "hono"
import { cors } from "hono/cors"
import { createAuth } from "./auth"
import { getMigrations } from "better-auth/db/migration"

type Bindings = {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  ADMIN_SECRET: string
  USER_TIMEZONE: string
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

// Session-protected API routes will be added in next phases
app.get("/", (c) => c.text("walkie-talkie api"))

export default app
