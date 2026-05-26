import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  type: text("type", {
    enum: ["reminder", "note", "bill", "idea", "shopping", "journal", "backlog"],
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
  status: text("status", { enum: ["pending", "confirmed"] }).notNull().default("confirmed"),
  userId: text("user_id").notNull(),
  projectId: text("project_id"),
})

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
export type ItemType = Item["type"]

export const contextPeople = sqliteTable("context_people", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
})

export type ContextPerson = typeof contextPeople.$inferSelect
export type NewContextPerson = typeof contextPeople.$inferInsert

export const contextProjects = sqliteTable("context_projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
})

export type ContextProject = typeof contextProjects.$inferSelect
export type NewContextProject = typeof contextProjects.$inferInsert

export const itemPeople = sqliteTable("item_people", {
  id: text("id").primaryKey(),
  itemId: text("item_id").notNull(),
  personId: text("person_id").notNull(),
})

export type ItemPerson = typeof itemPeople.$inferSelect
