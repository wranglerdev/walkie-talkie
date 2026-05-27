import type { ItemType } from "../db/schema"

export type ClassificationResult = {
  category: ItemType
  title: string
  dueDate?: string
  amount?: number
  paid?: boolean
  tags?: string[]
  confidence: number
  projectName?: string
}

function buildSystemPrompt(activeProjects: string[]): string {
  const projectsHint =
    activeProjects.length > 0
      ? `\nProjetos ativos disponíveis: ${activeProjects.map((p) => `"${p}"`).join(", ")}`
      : ""

  return `Você é um parser de lembretes pessoais em português brasileiro.

Analise o transcript de voz e extraia:
- category: reminder | note | bill | idea | shopping | journal | backlog
- title: título curto (máx 60 chars)
- dueDate: ISO 8601 se houver referência temporal (ex: amanhã, sexta, mês que vem)
- amount: número em BRL se houver valor monetário
- paid: boolean se for bill já pago
- tags: array de strings se for note
- projectName: nome do projeto (somente quando category=backlog; prefira um dos projetos ativos se houver correspondência)
- confidence: 0.0 a 1.0

Use category=backlog quando o usuário pedir explicitamente para adicionar algo ao backlog de um projeto.${projectsHint}

Retorne APENAS JSON válido, sem markdown, sem explicações.`
}

export async function classifyTranscript(
  transcript: string,
  now: Date,
  timezone: string,
  ai: Ai,
  activeProjects: string[] = [],
): Promise<ClassificationResult> {
  const userPrompt = `Data/hora atual: ${now.toISOString()} (timezone: ${timezone})\n\nTranscript: "${transcript}"`

  const response = await ai.run("@cf/cerebras/llama-4-scout-17b-16e-instruct", {
    messages: [
      { role: "system", content: buildSystemPrompt(activeProjects) },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  } as Parameters<Ai["run"]>[1])

  const content =
    typeof response === "object" && "response" in response
      ? (response.response as string)
      : ""

  let parsed: Partial<ClassificationResult> = {}
  try {
    parsed = JSON.parse(content) as Partial<ClassificationResult>
  } catch {
    // fallback to defaults below
  }

  return {
    category: parsed.category ?? "note",
    title: parsed.title ?? transcript.slice(0, 60),
    dueDate: parsed.dueDate,
    amount: parsed.amount,
    paid: parsed.paid,
    tags: parsed.tags,
    confidence: parsed.confidence ?? 0.5,
    projectName: parsed.projectName,
  }
}
