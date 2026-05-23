import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core"

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  type: text("type", {
    enum: ["reminder", "note", "bill", "idea", "shopping", "journal"],
  }).notNull(),
  title: text("title").notNull(),
  transcript: text("transcript").notNull(),
  audioUrl: text("audio_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  completed: integer("completed", { mode: "boolean" }),
  paid: integer("paid", { mode: "boolean" }),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
})

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
export type ItemType = Item["type"]
