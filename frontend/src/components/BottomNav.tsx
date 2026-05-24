type Tab = "home" | "history"

type Props = {
  active: Tab
  onChange: (tab: Tab) => void
}

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
)

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
  </svg>
)

export default function BottomNav({ active, onChange }: Props) {
  return (
    <div className="btm-nav btm-nav-sm">
      <button
        className={active === "home" ? "active" : ""}
        onClick={() => onChange("home")}
      >
        <HomeIcon />
        <span className="btm-nav-label">Home</span>
      </button>
      <button
        className={active === "history" ? "active" : ""}
        onClick={() => onChange("history")}
      >
        <HistoryIcon />
        <span className="btm-nav-label">Histórico</span>
      </button>
    </div>
  )
}
