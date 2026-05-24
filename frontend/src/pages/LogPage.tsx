import { useParams, Link } from "@tanstack/react-router"
import { useItem } from "../hooks/items"

function StepNode({
  index,
  title,
  subtitle,
  done,
  last,
  children,
}: {
  index: number
  title: string
  subtitle?: string
  done: boolean
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      {/* timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10 ${
            done ? "bg-success text-success-content" : "bg-base-300 text-base-content/50"
          }`}
        >
          {done ? "✓" : index}
        </div>
        {!last && <div className="w-px flex-1 bg-base-300 mt-1 min-h-6" />}
      </div>

      {/* content */}
      <div className="flex-1 pb-8">
        <div className="mb-2">
          <span className="font-semibold text-base-content">{title}</span>
          {subtitle && <span className="text-xs text-base-content/50 ml-2">{subtitle}</span>}
        </div>
        <div className="rounded-xl bg-base-200 border border-base-300 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

function CodeBlock({ value }: { value: unknown }) {
  return (
    <pre className="text-xs font-mono text-base-content/80 p-4 overflow-x-auto whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

export default function LogPage() {
  const { id } = useParams({ from: "/_authenticated/logs/$id" })
  const { data: item, isLoading, error } = useItem(id)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-error">{(error as Error)?.message ?? "Item não encontrado"}</p>
        <Link to="/history" className="btn btn-ghost btn-sm">← Voltar</Link>
      </div>
    )
  }

  const classification = {
    category: item.type,
    title: item.title,
    dueDate: item.dueDate ?? undefined,
    amount: item.metadata?.amount as number | undefined,
    paid: item.paid ?? undefined,
    tags: item.metadata?.tags as string[] | undefined,
    confidence: item.metadata?.confidence as number | undefined,
  }

  const savedRecord = {
    id: item.id,
    type: item.type,
    title: item.title,
    transcript: item.transcript,
    audioUrl: item.audioUrl,
    dueDate: item.dueDate,
    completed: item.completed,
    paid: item.paid,
    metadata: item.metadata,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }

  const createdAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(item.createdAt))

  return (
    <div className="flex-1 flex flex-col pb-20 px-4 max-w-2xl mx-auto w-full">
      {/* header */}
      <div className="flex items-center gap-3 py-4">
        <Link to="/history" className="btn btn-ghost btn-sm btn-square">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-base-content/50 truncate">run_{item.id}</p>
          <p className="font-semibold text-base-content truncate">{item.title}</p>
        </div>
        <span className="badge badge-success badge-sm shrink-0">concluído</span>
      </div>

      <p className="text-xs text-base-content/40 font-mono mb-6 pl-1">{createdAt}</p>

      {/* pipeline */}
      <div>
        {/* step 1 — audio */}
        <StepNode index={1} title="Áudio gravado" subtitle="R2" done={!!item.audioUrl}>
          {item.audioUrl ? (
            <div className="p-4">
              <audio
                controls
                src={item.audioUrl}
                className="w-full h-10"
                style={{ colorScheme: "dark" }}
              />
            </div>
          ) : (
            <p className="p-4 text-sm text-base-content/40">Sem áudio disponível</p>
          )}
        </StepNode>

        {/* step 2 — transcript */}
        <StepNode index={2} title="Transcrição" subtitle="Whisper (Workers AI)" done={!!item.transcript}>
          <p className="p-4 text-sm font-mono text-base-content/80 leading-relaxed">
            "{item.transcript}"
          </p>
        </StepNode>

        {/* step 3 — classification */}
        <StepNode index={3} title="Classificação" subtitle="LLaMA 3.3 70B" done>
          <CodeBlock value={classification} />
        </StepNode>

        {/* step 4 — saved */}
        <StepNode index={4} title="Salvo no D1" subtitle="Drizzle ORM" done last>
          <CodeBlock value={savedRecord} />
        </StepNode>
      </div>
    </div>
  )
}
