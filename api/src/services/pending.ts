import { eq } from "drizzle-orm"
import type { createDb } from "../db"
import { items } from "../db/schema"

export async function processAutoConfirm(
  db: ReturnType<typeof createDb>,
  itemId: string,
): Promise<void> {
  await db.update(items).set({ status: "confirmed" }).where(eq(items.id, itemId))
}
