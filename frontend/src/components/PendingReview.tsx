import { useEffect, useRef, useState } from "react"
import { X } from "@phosphor-icons/react"
import type { Item, ItemType } from "../api/client"
import { useConfirmItem, useDeleteItem } from "../hooks/items"

const TYPE_LABEL: Record<ItemType, string> = {
  reminder: "lembrete",
  bill: "conta",
  note: "nota",
  idea: "ideia",
  shopping: "compra",
  journal: "diário",
  backlog: "backlog",
}

const TYPE_BADGE: Record<ItemType, string> = {
  reminder: "bg-blue-500/15 text-blue-400",
  bill:     "bg-amber-500/15 text-amber-400",
  note:     "bg-sky-400/15 text-sky-300",
  idea:     "bg-purple-500/15 text-purple-400",
  shopping: "bg-emerald-500/15 text-emerald-400",
  journal:  "bg-rose-400/15 text-rose-300",
  backlog:  "bg-indigo-500/15 text-indigo-400",
}

const COUNTDOWN_SECONDS = 5

type Props = {
  item: Item
  onConfirmed: () => void
  onDiscarded: () => void
}

export default function PendingReview({ item, onConfirmed, onDiscarded }: Props) {
  const confidence = typeof item.metadata?.confidence === "number" ? item.metadata.confidence : 0
  const isHighConfidence = confidence >= 0.8

  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const discardedRef = useRef(false)

  const confirmItem = useConfirmItem()
  const deleteItem = useDeleteItem()

  useEffect(() => {
    if (!isHighConfidence) return
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval)
          if (!discardedRef.current) onConfirmed()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isHighConfidence, onConfirmed])

  async function handleConfirm() {
    try {
      await confirmItem.mutateAsync(item.id)
      onConfirmed()
    } catch {
      onConfirmed()
    }
  }

  async function handleDiscard() {
    discardedRef.current = true
    try {
      await deleteItem.mutateAsync(item.id)
    } finally {
      onDiscarded()
    }
  }

  const badgeClass = TYPE_BADGE[item.type]

  return (
    <div className="w-full max-w-sm">
      <p className="text-xs text-base-content/35 mb-2.5 text-center uppercase tracking-widest font-medium">
        {isHighConfidence ? "Auto-salvando..." : "Confirmar gravação"}
      </p>

      <div className="rounded-2xl bg-base-200/80 backdrop-blur-md border border-base-content/10 p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <span className={["inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 mt-0.5", badgeClass].join(" ")}>
            {TYPE_LABEL[item.type]}
          </span>
          <p className="text-base-content font-semibold flex-1 text-left text-sm leading-snug">{item.title}</p>
        </div>

        <p className="text-xs text-base-content/50 line-clamp-2 leading-relaxed">{item.transcript}</p>

        {isHighConfidence ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <span className="text-primary font-semibold text-sm tabular-nums">{secondsLeft}s</span>
              <div
                className="h-1.5 flex-1 rounded-full bg-base-300 overflow-hidden"
                role="progressbar"
                aria-valuenow={secondsLeft}
                aria-valuemax={COUNTDOWN_SECONDS}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-linear"
                  style={{ width: `${(secondsLeft / COUNTDOWN_SECONDS) * 100}%` }}
                />
              </div>
            </div>
            <button
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-sm text-error/70 hover:text-error hover:bg-error/10 transition-colors"
              onClick={handleDiscard}
            >
              <X size={14} weight="bold" />
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mt-1">
            <button
              className="flex-1 py-2 rounded-xl text-sm text-base-content/50 hover:text-base-content hover:bg-base-300 transition-colors"
              onClick={handleDiscard}
            >
              Descartar
            </button>
            <button
              className="flex-1 py-2 rounded-xl text-sm font-medium bg-primary text-primary-content hover:opacity-90 transition-opacity"
              onClick={handleConfirm}
            >
              Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
