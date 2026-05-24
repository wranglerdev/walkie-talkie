import { env } from "cloudflare:workers"
import { eq } from "drizzle-orm"
import { describe, it, expect, beforeAll, beforeEach } from "vitest"
import { createDb } from "../db"
import { items } from "../db/schema"
import { processAutoConfirm } from "../services/pending"

const BASE_ITEM = {
  type: "note" as const,
  title: "Test",
  transcript: "Test transcript",
  audioUrl: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
}

describe("processAutoConfirm", () => {
  let db: ReturnType<typeof createDb>

  beforeAll(async () => {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS `items` (`id` text PRIMARY KEY NOT NULL, `type` text NOT NULL, `title` text NOT NULL, `transcript` text NOT NULL, `audio_url` text, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, `due_date` integer, `completed` integer, `paid` integer, `metadata` text, `status` text NOT NULL DEFAULT 'confirmed')"
    ).run()
  })

  beforeEach(async () => {
    db = createDb(env.DB)
    await db.delete(items)
  })

  it("confirms a pending item", async () => {
    await db.insert(items).values({ id: "item-1", ...BASE_ITEM, status: "pending" })

    await processAutoConfirm(db, "item-1")

    const row = await db.select().from(items).where(eq(items.id, "item-1")).get()
    expect(row?.status).toBe("confirmed")
  })

  it("is a no-op for an already-confirmed item", async () => {
    await db.insert(items).values({ id: "item-2", ...BASE_ITEM, status: "confirmed" })

    await processAutoConfirm(db, "item-2")

    const row = await db.select().from(items).where(eq(items.id, "item-2")).get()
    expect(row?.status).toBe("confirmed")
  })

  it("does not throw when item does not exist", async () => {
    await expect(processAutoConfirm(db, "nonexistent")).resolves.toBeUndefined()
  })
})
