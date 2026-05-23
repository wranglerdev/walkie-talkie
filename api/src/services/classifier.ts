import OpenAI from "openai"
import type { ItemType } from "../db/schema"

export type ClassificationResult = {
  category: ItemType
  title: string
  dueDate?: string
  amount?: number
  paid?: boolean
  tags?: string[]
  confidence: number
}

const SYSTEM_PROMPT = `Você é um parser de lembretes pessoais em português brasileiro.

Analise o transcript de voz e extraia:
- category: reminder | note | bill | idea | shopping | journal
- title: título curto (máx 60 chars)
- dueDate: ISO 8601 se houver referência temporal (ex: amanhã, sexta, mês que vem)
- amount: número em BRL se houver valor monetário
- paid: boolean se for bill já pago
- tags: array de strings se for note
- confidence: 0.0 a 1.0

Retorne APENAS JSON válido, sem markdown, sem explicações.`

export async function classifyTranscript(
  transcript: string,
  now: Date,
  timezone: string,
  apiKey: string,
): Promise<ClassificationResult> {
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  })

  const userPrompt = `Data/hora atual: ${now.toISOString()} (timezone: ${timezone})\n\nTranscript: "${transcript}"`

  const response = await client.chat.completions.create({
    model: "x-ai/grok-3-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  })

  const content = response.choices[0]?.message?.content ?? "{}"
  const parsed = JSON.parse(content) as ClassificationResult

  return {
    category: parsed.category ?? "note",
    title: parsed.title ?? transcript.slice(0, 60),
    dueDate: parsed.dueDate,
    amount: parsed.amount,
    paid: parsed.paid,
    tags: parsed.tags,
    confidence: parsed.confidence ?? 0.5,
  }
}
