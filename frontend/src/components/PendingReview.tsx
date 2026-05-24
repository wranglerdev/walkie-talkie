import { useEffect, useRef, useState } from "react"
import type { Item, ItemType } from "../api/client"
import { api } from "../api/client"

const BADGE_COLOR: Record<ItemType, string> = {
  reminder: "badge-primary",
  bill: "badge-warning",
  note: "badge-info",
  idea: "badge-secondary",
  shopping: "badge-success",
  journal: "badge-ghost",
}

const LABEL: Record<ItemType, string> = {
  reminder: "lembrete",
  bill: "conta",
  note: "nota",
  idea: "ideia",
  shopping: "compra",
  journal: "diário",
}

const COUNTDOWN_SECONDS = 5

type Props = {
  item: Item
  onConfirmed: (item: Item) => void
  onDiscarded: () => void
}

export default function PendingReview({ item, onConfirmed, onDiscarded }: Props) {
  const confidence = typeof item.metadata?.confidence === "number" ? item.metadata.confidence : 0
  const isHighConfidence = confidence >= 0.8

  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const discardedRef = useRef(false)

  useEffect(() => {
    if (!isHighConfidence) return

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval)
          if (!discardedRef.current) {
            onConfirmed({ ...item, status: "confirmed" })
          }
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isHighConfidence, item, onConfirmed])

  async function handleConfirm() {
    try {
      const confirmed = await api.items.confirm(item.id)
      onConfirmed(confirmed)
    } catch {
      onConfirmed({ ...item, status: "confirmed" })
    }
  }

  async function handleDiscard() {
    discardedRef.current = true
    try {
      await api.items.delete(item.id)
    } finally {
      onDiscarded()
    }
  }

  return (
    <div className="w-full max-w-sm">
      <p className="text-xs text-base-content/40 mb-2 text-center uppercase tracking-wider">
        {isHighConfidence ? "Salvando em..." : "Confirmar transcrição"}
      </p>

      <div className="card bg-base-200">
        <div className="card-body gap-3">
          <div className="flex items-start gap-2">
            <span className={`badge ${BADGE_COLOR[item.type]} shrink-0 mt-0.5`}>
              {LABEL[item.type]}
            </span>
            <p className="text-base-content font-medium flex-1 text-left">{item.title}</p>
          </div>

          <p className="text-sm text-base-content/60 line-clamp-2">{item.transcript}</p>

          {isHighConfidence ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-base-content/50">{secondsLeft}s</span>
                <div
                  className="h-1.5 flex-1 mx-3 rounded-full bg-base-300 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={secondsLeft}
                  aria-valuemax={COUNTDOWN_SECONDS}
                >
                  <div
                    className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(secondsLeft / COUNTDOWN_SECONDS) * 100}%` }}
                  />
                </div>
              </div>
              <button className="btn btn-sm btn-ghost btn-error w-full" onClick={handleDiscard}>
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button className="btn btn-sm btn-ghost flex-1" onClick={handleDiscard}>
                Descartar
              </button>
              <button className="btn btn-sm btn-primary flex-1" onClick={handleConfirm}>
                Confirmar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
