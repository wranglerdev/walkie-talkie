import { Hono } from "hono"
import { createDb } from "./db"

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get("/", (c) => {
  return c.text("walkie-talkie api")
})

export default app
