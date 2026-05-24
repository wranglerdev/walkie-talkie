import { useSession } from "./lib/auth-client"
import LoginPage from "./pages/LoginPage"

export default function App() {
  const { data: session, isPending } = useSession()

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

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center">
      <p className="text-base-content">Bem-vindo, {session.user.name}!</p>
    </div>
  )
}
