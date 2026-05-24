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
  ITEM_QUEUE: Queue<{ itemId: string }>
}

type Variables = {
  userId: string
}

const MAX_AUDIO_SIZE = 25 * 1024 * 1024 // 25 MB
// WebM files begin with EBML header 0x1A 0x45 0xDF 0xA3
const WEBM_MAGIC = [0x1a, 0x45, 0xdf, 0xa3]

export async function validateAudioFile(
  file: Pick<File, "size" | "type"> & { slice(start: number, end: number): Blob },
): Promise<{ valid: true } | { valid: false; error: string; status: 413 | 415 }> {
  if (file.size > MAX_AUDIO_SIZE) {
    return { valid: false, error: "Arquivo muito grande (máx 25 MB)", status: 413 }
  }

  const baseType = file.type.split(";")[0].trim()
  if (!baseType.startsWith("audio/")) {
    return { valid: false, error: "Tipo de arquivo inválido — deve ser áudio", status: 415 }
  }

  // Verify magic bytes for webm (the only format the recorder produces)
  if (baseType === "audio/webm") {
    const header = await file.slice(0, 4).arrayBuffer()
    const bytes = new Uint8Array(header)
    const valid = WEBM_MAGIC.every((b, i) => bytes[i] === b)
    if (!valid) {
      return { valid: false, error: "Conteúdo do arquivo inválido", status: 415 }
    }
  }

  return { valid: true }
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
    return c.json({ error: "Nenhum arquivo de áudio fornecido" }, 400)
  }

  const validation = await validateAudioFile(audioFile)
  if (!validation.valid) {
    return c.json({ error: validation.error }, validation.status)
  }

  const userId = c.get("userId")
  const audioKey = `${userId}/${createId()}.webm`
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

  const confidence = classification.confidence ?? 0
  const autoConfirm = confidence >= 0.8

  const newItem = {
    id,
    userId,
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
    status: "pending" as const,
  }

  await db.insert(items).values(newItem)

  if (autoConfirm) {
    await c.env.ITEM_QUEUE.send({ itemId: id }, { delaySeconds: 5 })
  }

  return c.json(newItem, 201)
})

// Serve audio from R2 — path includes userId so ownership is implicit in the session check
audioRoute.get("/:userId/:key", async (c) => {
  if (c.req.param("userId") !== c.get("userId")) {
    return c.json({ error: "Forbidden" }, 403)
  }

  const audioKey = `${c.req.param("userId")}/${c.req.param("key")}`
  const object = await c.env.AUDIO_BUCKET.get(audioKey)
  if (!object) return c.json({ error: "Not found" }, 404)

  return new Response(object.body, {
    headers: {
      "Content-Type": "audio/webm",
      "Cache-Control": "private, max-age=3600",
    },
  })
})

export { audioRoute }
