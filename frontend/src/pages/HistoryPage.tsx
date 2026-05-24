import { useState } from "react"
import { useItems } from "../hooks/items"
import type { ItemType } from "../api/client"
import ItemCard from "../components/ItemCard"

const FILTERS: { label: string; value: ItemType | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Lembrete", value: "reminder" },
  { label: "Nota", value: "note" },
  { label: "Conta", value: "bill" },
  { label: "Ideia", value: "idea" },
]

export default function HistoryPage() {
  const [filter, setFilter] = useState<ItemType | "all">("all")
  const { data: items = [], isLoading } = useItems(filter === "all" ? undefined : filter)

  return (
    <div className="flex-1 flex flex-col pb-20 px-4">
      <h2 className="text-xl font-semibold text-base-content py-4 text-center">Histórico</h2>

      <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`btn btn-sm ${filter === f.value ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 mt-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="text-center text-base-content/40 py-12">
            <p>Nenhum item encontrado.</p>
            <p className="text-sm mt-1">Grave algo na tela inicial!</p>
          </div>
        )}

        {!isLoading &&
          items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
      </div>
    </div>
  )
}
