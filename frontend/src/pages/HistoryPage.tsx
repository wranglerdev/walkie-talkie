import { useState, useEffect, useCallback } from "react"
import { api, type Item, type ItemType } from "../api/client"
import ItemCard from "../components/ItemCard"

const FILTERS: { label: string; value: ItemType | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Lembrete", value: "reminder" },
  { label: "Nota", value: "note" },
  { label: "Conta", value: "bill" },
  { label: "Ideia", value: "idea" },
]

type Props = {
  onItemUpdate?: (item: Item) => void
}

export default function HistoryPage({ onItemUpdate }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState<ItemType | "all">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const type = filter === "all" ? undefined : filter
    api.items.list(type).then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [filter])

  const handleUpdate = useCallback(
    (updated: Item) => {
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      onItemUpdate?.(updated)
    },
    [onItemUpdate],
  )

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
        {loading && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center text-base-content/40 py-12">
            <p>Nenhum item encontrado.</p>
            <p className="text-sm mt-1">Grave algo na tela inicial!</p>
          </div>
        )}

        {!loading &&
          items.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={handleUpdate} />
          ))}
      </div>
    </div>
  )
}
