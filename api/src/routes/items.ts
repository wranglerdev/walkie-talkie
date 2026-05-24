import { Hono } from "hono"
import { eq, and } from "drizzle-orm"
import { createDb } from "../db"
import { items } from "../db/schema"
import { createAuth } from "../auth"
import { sessionMiddleware } from "../middleware/session"

type Bindings = {
  DB: D1Database
  AUDIO_BUCKET: R2Bucket
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

type Variables = {
  userId: string
}

const itemsRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>()

itemsRoute.use("*", async (c, next) => {
  const auth = createAuth(c.env.DB, c.env.BETTER_AUTH_SECRET, c.env.BETTER_AUTH_URL)
  return sessionMiddleware(auth)(c, next)
})

itemsRoute.get("/", async (c) => {
  const db = createDb(c.env.DB)
  const userId = c.get("userId")
  const type = c.req.query("type")

  const base = and(eq(items.status, "confirmed"), eq(items.userId, userId))
  const rows = type
    ? await db
        .select()
        .from(items)
        .where(and(base, eq(items.type, type as typeof items.$inferSelect.type)))
    : await db.select().from(items).where(base)

  return c.json(rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
})

itemsRoute.get("/:id", async (c) => {
  const db = createDb(c.env.DB)
  const row = await db
    .select()
    .from(items)
    .where(and(eq(items.id, c.req.param("id")), eq(items.userId, c.get("userId"))))
    .get()
  if (!row) return c.json({ error: "Not found" }, 404)
  return c.json(row)
})

itemsRoute.post("/:id/confirm", async (c) => {
  const db = createDb(c.env.DB)
  const updated = await db
    .update(items)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(and(eq(items.id, c.req.param("id")), eq(items.userId, c.get("userId"))))
    .returning()
    .get()
  if (!updated) return c.json({ error: "Not found" }, 404)
  return c.json(updated)
})

itemsRoute.patch("/:id", async (c) => {
  const db = createDb(c.env.DB)
  const body = await c.req.json<Record<string, unknown>>()

  // Whitelist of user-editable fields — prevents injection of userId, type, etc.
  const patch: Partial<typeof items.$inferInsert> = {}
  if (typeof body.title === "string") patch.title = body.title
  if (body.completed !== undefined) patch.completed = body.completed as boolean | null
  if (body.paid !== undefined) patch.paid = body.paid as boolean | null
  if (body.dueDate !== undefined) {
    patch.dueDate = body.dueDate ? new Date(body.dueDate as string) : null
  }

  if (Object.keys(patch).length === 0) {
    return c.json({ error: "Nenhum campo válido para atualizar" }, 400)
  }

  const updated = await db
    .update(items)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(items.id, c.req.param("id")), eq(items.userId, c.get("userId"))))
    .returning()
    .get()
  if (!updated) return c.json({ error: "Not found" }, 404)
  return c.json(updated)
})

itemsRoute.delete("/:id", async (c) => {
  const db = createDb(c.env.DB)
  const item = await db
    .select()
    .from(items)
    .where(and(eq(items.id, c.req.param("id")), eq(items.userId, c.get("userId"))))
    .get()
  if (!item) return c.json({ error: "Not found" }, 404)

  if (item.audioUrl) {
    const key = item.audioUrl.replace("/api/audio/", "")
    if (key) await c.env.AUDIO_BUCKET.delete(key)
  }

  await db
    .delete(items)
    .where(and(eq(items.id, c.req.param("id")), eq(items.userId, c.get("userId"))))
  return c.json({ success: true })
})

export { itemsRoute }
