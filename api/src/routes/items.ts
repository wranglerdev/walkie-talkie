import { Hono } from "hono"
import { eq, and } from "drizzle-orm"
import { createDb } from "../db"
import { items, contextProjects } from "../db/schema"
import { createAuth } from "../auth"
import { sessionMiddleware } from "../middleware/session"
import { itemPatchSchema } from "@walkie-talkie/shared"

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

// Returns backlog items grouped by project
itemsRoute.get("/backlog", async (c) => {
  const db = createDb(c.env.DB)
  const userId = c.get("userId")

  const [projects, backlogItems] = await Promise.all([
    db.select().from(contextProjects).where(eq(contextProjects.userId, userId)),
    db.select().from(items).where(
      and(eq(items.status, "confirmed"), eq(items.userId, userId), eq(items.type, "backlog")),
    ),
  ])

  const grouped = projects.map((p) => ({
    project: p,
    items: backlogItems
      .filter((i) => i.projectId === p.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  }))

  // Items without a matched project
  const unlinked = backlogItems
    .filter((i) => !i.projectId || !projects.find((p) => p.id === i.projectId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return c.json({ grouped, unlinked })
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
  const raw = await c.req.json()
  const parsed = itemPatchSchema.safeParse(raw)
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400)
  }

  const { title, completed, paid, dueDate } = parsed.data
  const patch: Partial<typeof items.$inferInsert> = {}
  if (title !== undefined) patch.title = title
  if (completed !== undefined) patch.completed = completed
  if (paid !== undefined) patch.paid = paid
  if (dueDate !== undefined) patch.dueDate = dueDate ? new Date(dueDate) : null

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
