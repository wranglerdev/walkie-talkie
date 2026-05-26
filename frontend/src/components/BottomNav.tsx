import { Link, useRouterState } from "@tanstack/react-router"
import { House, ClockCounterClockwise, Users, Stack } from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"

const NAV_ITEMS: { to: string; label: string; icon: Icon; exact: boolean }[] = [
  { to: "/", label: "Início", icon: House, exact: true },
  { to: "/history", label: "Histórico", icon: ClockCounterClockwise, exact: false },
  { to: "/context", label: "Contexto", icon: Users, exact: false },
  { to: "/backlog", label: "Backlog", icon: Stack, exact: false },
]

export default function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 flex justify-around items-center px-2 backdrop-blur-xl bg-base-100/80 border-t border-base-content/5 z-50">
      {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === to : pathname.startsWith(to)
        return (
          <Link
            key={to}
            to={to}
            className="relative flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <span className={["transition-colors duration-150", isActive ? "text-primary" : "text-base-content/35"].join(" ")}>
              <Icon size={22} weight="fill" />
            </span>
            <span
              className={[
                "text-[10px] font-medium tracking-wide transition-colors duration-150",
                isActive ? "text-primary" : "text-base-content/30",
              ].join(" ")}
            >
              {label}
            </span>
            {isActive && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
