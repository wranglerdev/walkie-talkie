import { useState, useEffect } from "react"
import { useSession } from "./lib/auth-client"
import { api, type Item } from "./api/client"
import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import HistoryPage from "./pages/HistoryPage"
import BottomNav from "./components/BottomNav"

type Tab = "home" | "history"

export default function App() {
  const { data: session, isPending } = useSession()
  const [tab, setTab] = useState<Tab>("home")
  const [lastItem, setLastItem] = useState<Item | null>(null)

  useEffect(() => {
    if (!session) return
    api.items.list().then((items) => {
      if (items.length > 0) setLastItem(items[0])
    })
  }, [session])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-ring loading-lg text-primary" />
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  function handleNewItem(item: Item) {
    setLastItem(item)
    setTab("home")
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-100">
      {tab === "home" && (
        <HomePage lastItem={lastItem} onNewItem={handleNewItem} />
      )}
      {tab === "history" && (
        <HistoryPage onItemUpdate={setLastItem} />
      )}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
