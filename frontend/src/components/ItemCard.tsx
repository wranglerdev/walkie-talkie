import { Link } from "@tanstack/react-router"
import {
  Bell, CurrencyDollar, Note, Lightbulb, ShoppingCart, BookOpen, Stack,
  UserCircle, CheckCircle, ArrowSquareOut,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"
import type { Item, ItemType } from "../api/client"
import { usePatchItem } from "../hooks/items"

const TYPE_CONFIG: Record<ItemType, { label: string; accentClass: string; badgeClass: string; Icon: Icon }> = {
  reminder: { label: "lembrete",  accentClass: "bg-blue-500",    badgeClass: "bg-blue-500/15 text-blue-400",    Icon: Bell },
  bill:     { label: "conta",     accentClass: "bg-amber-500",   badgeClass: "bg-amber-500/15 text-amber-400",  Icon: CurrencyDollar },
  note:     { label: "nota",      accentClass: "bg-sky-400",     badgeClass: "bg-sky-400/15 text-sky-300",      Icon: Note },
  idea:     { label: "ideia",     accentClass: "bg-purple-500",  badgeClass: "bg-purple-500/15 text-purple-400", Icon: Lightbulb },
  shopping: { label: "compra",    accentClass: "bg-emerald-500", badgeClass: "bg-emerald-500/15 text-emerald-400", Icon: ShoppingCart },
  journal:  { label: "diário",    accentClass: "bg-rose-400",    badgeClass: "bg-rose-400/15 text-rose-300",    Icon: BookOpen },
  backlog:  { label: "backlog",   accentClass: "bg-indigo-500",  badgeClass: "bg-indigo-500/15 text-indigo-400", Icon: Stack },
}

type Props = {
  item: Item
  compact?: boolean
}

export default function ItemCard({ item, compact = false }: Props) {
  const patchItem = usePatchItem()
  const cfg = TYPE_CONFIG[item.type]

  const dueDate = item.dueDate
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(item.dueDate))
    : null

  const pessoas = Array.isArray(item.metadata?.pessoas)
    ? (item.metadata.pessoas as string[])
    : []

  function toggleComplete() {
    patchItem.mutate({ id: item.id, data: { completed: !item.completed } })
  }

  function togglePaid() {
    patchItem.mutate({ id: item.id, data: { paid: !item.paid } })
  }

  return (
    <div className="flex rounded-2xl bg-base-200 border border-base-content/8 overflow-hidden">
      {/* Left accent bar */}
      <div className={["w-1 shrink-0", cfg.accentClass].join(" ")} />

      {/* Content */}
      <div className={["flex-1", compact ? "px-3 py-2.5" : "px-4 py-3"].join(" ")}>
        <div className="flex items-start gap-2">
          <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5", cfg.badgeClass].join(" ")}>
            <span className="inline-flex"><cfg.Icon size={11} weight="fill" /></span>
            {cfg.label}
          </span>
          <p
            className={[
              "text-base-content font-medium flex-1 text-left text-sm leading-snug",
              item.completed || item.paid ? "line-through opacity-40" : "",
            ].join(" ")}
          >
            {item.title}
          </p>
        </div>

        {!compact && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {dueDate && (
              <span className="text-xs text-base-content/45">{dueDate}</span>
            )}
            {pessoas.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-base-content/45">
                <UserCircle size={12} weight="fill" />
                {pessoas.join(", ")}
              </span>
            )}
            <div className="flex items-center gap-1 ml-auto">
              {item.completed != null && (
                <button
                  className="flex items-center gap-1 text-xs text-base-content/40 hover:text-success transition-colors px-1.5 py-1 rounded-lg hover:bg-success/10"
                  onClick={toggleComplete}
                >
                  <CheckCircle size={14} weight={item.completed ? "fill" : "regular"} />
                  {item.completed ? "feito" : "concluir"}
                </button>
              )}
              {item.paid != null && (
                <button
                  className="flex items-center gap-1 text-xs text-base-content/40 hover:text-warning transition-colors px-1.5 py-1 rounded-lg hover:bg-warning/10"
                  onClick={togglePaid}
                >
                  <CurrencyDollar size={14} weight={item.paid ? "fill" : "regular"} />
                  {item.paid ? "pago" : "pagar"}
                </button>
              )}
              <Link
                to="/logs/$id"
                params={{ id: item.id }}
                className="flex items-center text-base-content/25 hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10"
              >
                <ArrowSquareOut size={14} weight="fill" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
