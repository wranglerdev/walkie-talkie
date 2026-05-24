import { Link } from "@tanstack/react-router"
import type { Item, ItemType } from "../api/client"
import { usePatchItem } from "../hooks/items"

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

type Props = {
  item: Item
  compact?: boolean
}

export default function ItemCard({ item, compact = false }: Props) {
  const patchItem = usePatchItem()

  const dueDate = item.dueDate
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(item.dueDate))
    : null

  function toggleComplete() {
    patchItem.mutate({ id: item.id, data: { completed: !item.completed } })
  }

  function togglePaid() {
    patchItem.mutate({ id: item.id, data: { paid: !item.paid } })
  }

  return (
    <div className={`card bg-base-200 ${compact ? "card-compact" : ""}`}>
      <div className="card-body">
        <div className="flex items-start gap-2">
          <span className={`badge ${BADGE_COLOR[item.type]} shrink-0 mt-0.5`}>
            {LABEL[item.type]}
          </span>
          <p
            className={`text-base-content font-medium flex-1 text-left ${
              item.completed || item.paid ? "line-through opacity-50" : ""
            }`}
          >
            {item.title}
          </p>
        </div>

        {!compact && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {dueDate && (
              <span className="text-xs text-base-content/60">{dueDate}</span>
            )}
            {item.completed != null && (
              <button
                className="btn btn-xs btn-ghost"
                onClick={toggleComplete}
              >
                {item.completed ? "✓ concluído" : "marcar concluído"}
              </button>
            )}
            {item.paid != null && (
              <button
                className="btn btn-xs btn-ghost"
                onClick={togglePaid}
              >
                {item.paid ? "✓ pago" : "marcar pago"}
              </button>
            )}
            <Link
              to="/logs/$id"
              params={{ id: item.id }}
              className="btn btn-xs btn-ghost ml-auto opacity-40 hover:opacity-100"
            >
              ver log →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
