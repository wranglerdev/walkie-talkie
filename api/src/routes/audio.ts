import { Hono } from "hono"
import { createId } from "@paralleldrive/cuid2"
import { createDb } from "../db"
import { items } from "../db/schema"
import { createAuth } from "../auth"
import { sessionMiddleware } from "../middleware/session"
import { transcribeAudio } from "../services/transcription"
import { classifyTranscript } from "../services/classifier"

type Bindings = {
  DB: D1Database
  AUDIO_BUCKET: R2Bucket
  AI: Ai
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  OPENROUTER_API_KEY: string
  USER_TIMEZONE: string
}

type Variables = {
  userId: string
}

const audioRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>()

audioRoute.use("*", async (c, next) => {
  const auth = createAuth(c.env.DB, c.env.BETTER_AUTH_SECRET, c.env.BETTER_AUTH_URL)
  return sessionMiddleware(auth)(c, next)
})

audioRoute.post("/upload", async (c) => {
  const formData = await c.req.formData()
  const audioFile = formData.get("audio") as File | null
  const duration = Number(formData.get("duration") ?? 0)
  const clientNowRaw = formData.get("clientNow") as string | null

  if (!audioFile) {
    return c.json({ error: "No audio file provided" }, 400)
  }

  const audioKey = `${createId()}.webm`
  const audioBlob = await audioFile.arrayBuffer()

  // Save to R2
  await c.env.AUDIO_BUCKET.put(audioKey, audioBlob, {
    httpMetadata: { contentType: "audio/webm" },
  })

  const audioUrl = `/api/audio/${audioKey}`

  // Transcribe
  const blob = new Blob([audioBlob], { type: "audio/webm" })
  const transcript = await transcribeAudio(blob, c.env.AI)

  // Classify
  const now = clientNowRaw ? new Date(clientNowRaw) : new Date()
  const classification = await classifyTranscript(
    transcript,
    now,
    c.env.USER_TIMEZONE,
    c.env.AI,
  )

  // Save to D1
  const db = createDb(c.env.DB)
  const id = createId()
  const dueDate = classification.dueDate ? new Date(classification.dueDate) : null

  const metadata: Record<string, unknown> = {}
  if (classification.amount != null) metadata.amount = classification.amount
  if (classification.tags) metadata.tags = classification.tags
  if (classification.confidence != null) metadata.confidence = classification.confidence

  const newItem = {
    id,
    type: classification.category,
    title: classification.title,
    transcript,
    audioUrl,
    createdAt: now,
    updatedAt: now,
    dueDate,
    completed: classification.category === "reminder" || classification.category === "shopping" ? false : null,
    paid: classification.category === "bill" ? (classification.paid ?? false) : null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  }

  await db.insert(items).values(newItem)

  return c.json(newItem, 201)
})

// Serve audio from R2
audioRoute.get("/:key", async (c) => {
  const object = await c.env.AUDIO_BUCKET.get(c.req.param("key"))
  if (!object) return c.json({ error: "Not found" }, 404)

  return new Response(object.body, {
    headers: {
      "Content-Type": "audio/webm",
      "Cache-Control": "private, max-age=3600",
    },
  })
})

export { audioRoute }
