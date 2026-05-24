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
  const type = c.req.query("type")

  const query = db.select().from(items)
  const rows = type
    ? await query.where(and(eq(items.status, "confirmed"), eq(items.type, type as typeof items.$inferSelect.type)))
    : await query.where(eq(items.status, "confirmed"))

  return c.json(rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
})

itemsRoute.get("/:id", async (c) => {
  const db = createDb(c.env.DB)
  const row = await db.select().from(items).where(eq(items.id, c.req.param("id"))).get()
  if (!row) return c.json({ error: "Not found" }, 404)
  return c.json(row)
})

itemsRoute.post("/:id/confirm", async (c) => {
  const db = createDb(c.env.DB)
  const updated = await db
    .update(items)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(items.id, c.req.param("id")))
    .returning()
    .get()
  if (!updated) return c.json({ error: "Not found" }, 404)
  return c.json(updated)
})

itemsRoute.patch("/:id", async (c) => {
  const db = createDb(c.env.DB)
  const body = await c.req.json<Partial<typeof items.$inferInsert>>()
  const now = new Date()
  const updated = await db
    .update(items)
    .set({ ...body, updatedAt: now })
    .where(eq(items.id, c.req.param("id")))
    .returning()
    .get()
  if (!updated) return c.json({ error: "Not found" }, 404)
  return c.json(updated)
})

itemsRoute.delete("/:id", async (c) => {
  const db = createDb(c.env.DB)
  const item = await db.select().from(items).where(eq(items.id, c.req.param("id"))).get()
  if (!item) return c.json({ error: "Not found" }, 404)

  // Delete audio from R2 if exists
  if (item.audioUrl) {
    const key = item.audioUrl.split("/").pop()
    if (key) await c.env.AUDIO_BUCKET.delete(key)
  }

  await db.delete(items).where(eq(items.id, c.req.param("id")))
  return c.json({ success: true })
})

export { itemsRoute }
