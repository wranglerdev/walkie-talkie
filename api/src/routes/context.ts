import { Hono } from "hono"
import { eq, and, or, isNull, gt } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { createDb } from "../db"
import { contextPeople, contextProjects } from "../db/schema"
import { createAuth } from "../auth"
import { sessionMiddleware } from "../middleware/session"
import { createPersonSchema, createProjectSchema } from "@walkie-talkie/shared"

type Bindings = {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

type Variables = {
  userId: string
}

const contextRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>()

contextRoute.use("*", async (c, next) => {
  const auth = createAuth(c.env.DB, c.env.BETTER_AUTH_SECRET, c.env.BETTER_AUTH_URL)
  return sessionMiddleware(auth)(c, next)
})

// --- People ---

contextRoute.get("/people", async (c) => {
  const db = createDb(c.env.DB)
  const userId = c.get("userId")
  const now = new Date()
  const rows = await db
    .select()
    .from(contextPeople)
    .where(
      and(
        eq(contextPeople.userId, userId),
        or(isNull(contextPeople.expiresAt), gt(contextPeople.expiresAt, now)),
      ),
    )
  return c.json(rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
})

contextRoute.post("/people", async (c) => {
  const db = createDb(c.env.DB)
  const userId = c.get("userId")
  const raw = await c.req.json()
  const parsed = createPersonSchema.safeParse(raw)
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400)
  }
  const { name, expiresAt } = parsed.data
  const now = new Date()
  const row = {
    id: createId(),
    userId,
    name,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    createdAt: now,
  }
  await db.insert(contextPeople).values(row)
  return c.json(row, 201)
})

contextRoute.delete("/people/:id", async (c) => {
  const db = createDb(c.env.DB)
  const deleted = await db
    .delete(contextPeople)
    .where(
      and(
        eq(contextPeople.id, c.req.param("id")),
        eq(contextPeople.userId, c.get("userId")),
      ),
    )
    .returning()
    .get()
  if (!deleted) return c.json({ error: "Not found" }, 404)
  return c.json({ success: true })
})

// --- Projects ---

contextRoute.get("/projects", async (c) => {
  const db = createDb(c.env.DB)
  const rows = await db
    .select()
    .from(contextProjects)
    .where(eq(contextProjects.userId, c.get("userId")))
  return c.json(rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
})

contextRoute.post("/projects", async (c) => {
  const db = createDb(c.env.DB)
  const userId = c.get("userId")
  const raw = await c.req.json()
  const parsed = createProjectSchema.safeParse(raw)
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400)
  }
  const now = new Date()
  const row = {
    id: createId(),
    userId,
    name: parsed.data.name,
    active: true,
    createdAt: now,
  }
  await db.insert(contextProjects).values(row)
  return c.json(row, 201)
})

contextRoute.patch("/projects/:id", async (c) => {
  const db = createDb(c.env.DB)
  const { active } = await c.req.json<{ active: boolean }>()
  const updated = await db
    .update(contextProjects)
    .set({ active })
    .where(
      and(
        eq(contextProjects.id, c.req.param("id")),
        eq(contextProjects.userId, c.get("userId")),
      ),
    )
    .returning()
    .get()
  if (!updated) return c.json({ error: "Not found" }, 404)
  return c.json(updated)
})

contextRoute.delete("/projects/:id", async (c) => {
  const db = createDb(c.env.DB)
  const deleted = await db
    .delete(contextProjects)
    .where(
      and(
        eq(contextProjects.id, c.req.param("id")),
        eq(contextProjects.userId, c.get("userId")),
      ),
    )
    .returning()
    .get()
  if (!deleted) return c.json({ error: "Not found" }, 404)
  return c.json({ success: true })
})

export { contextRoute }
