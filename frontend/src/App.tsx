import { RouterProvider } from "@tanstack/react-router"
import { useSession } from "./lib/auth-client"
import { router } from "./router"

export default function App() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-ring loading-lg text-primary" />
      </div>
    )
  }

  return <RouterProvider router={router} context={{ auth: { session } }} />
}
