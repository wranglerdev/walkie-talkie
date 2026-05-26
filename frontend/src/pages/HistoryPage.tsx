import { useState, useMemo } from "react"
import {
  SquaresFour, Bell, Note, CurrencyDollar, Lightbulb, MicrophoneSlash,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"
import { useItems } from "../hooks/items"
import type { Item, ItemType } from "../api/client"
import ItemCard from "../components/ItemCard"

const FILTERS: { label: string; value: ItemType | "all"; Icon: Icon }[] = [
  { label: "Todos",    value: "all",      Icon: SquaresFour },
  { label: "Lembrete", value: "reminder", Icon: Bell },
  { label: "Nota",     value: "note",     Icon: Note },
  { label: "Conta",    value: "bill",     Icon: CurrencyDollar },
  { label: "Ideia",    value: "idea",     Icon: Lightbulb },
]

function dateSeparatorLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const d = date.toDateString()
  if (d === today.toDateString()) return "Hoje"
  if (d === yesterday.toDateString()) return "Ontem"
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date)
}

function groupByDay(items: Item[]): { label: string; items: Item[] }[] {
  const groups: { label: string; items: Item[] }[] = []
  let currentLabel = ""

  for (const item of items) {
    const label = dateSeparatorLabel(item.createdAt)
    if (label !== currentLabel) {
      currentLabel = label
      groups.push({ label, items: [] })
    }
    groups[groups.length - 1].items.push(item)
  }

  return groups
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<ItemType | "all">("all")
  const { data: items = [], isLoading } = useItems(filter === "all" ? undefined : filter)

  const groups = useMemo(() => groupByDay(items), [items])

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Sticky filter row */}
      <div className="sticky top-0 z-10 bg-base-100/90 backdrop-blur-xl border-b border-base-content/5 px-4 pt-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {FILTERS.map(({ label, value, Icon }) => {
            const active = filter === value
            return (
              <button
                key={value}
                className={[
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium shrink-0 transition-all duration-150",
                  active
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 text-base-content/50 hover:text-base-content/80",
                ].join(" ")}
                onClick={() => setFilter(value)}
              >
                <span className="inline-flex"><Icon size={13} weight="fill" /></span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col px-4 mt-3">
        {isLoading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-ring loading-md text-primary" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 text-center py-16">
            <span className="text-base-content/15"><MicrophoneSlash size={48} weight="fill" /></span>
            <p className="text-base-content/35 text-sm">Nenhum item encontrado.</p>
            <p className="text-base-content/20 text-xs">Grave algo na tela inicial!</p>
          </div>
        )}

        {!isLoading && groups.map(({ label, items: groupItems }) => (
          <div key={label} className="mb-5">
            {/* Date separator */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-base-content/8" />
              <span className="text-[10px] text-base-content/30 uppercase tracking-widest font-medium shrink-0">
                {label}
              </span>
              <div className="h-px flex-1 bg-base-content/8" />
            </div>

            <div className="flex flex-col gap-2.5">
              {groupItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
