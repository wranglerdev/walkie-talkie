import { useState, useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useForm, type AnyFieldApi } from "@tanstack/react-form"
import { loginSchema } from "@walkie-talkie/shared"
import { signIn, useSession } from "../lib/auth-client"

function FieldErrors({ field }: { field: AnyFieldApi }) {
  if (!field.state.meta.isTouched || field.state.meta.errors.length === 0) return null
  return (
    <span className="text-error text-xs mt-1.5">
      {field.state.meta.errors
        .map((e) =>
          typeof e === "string" ? e : e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : String(e),
        )
        .filter(Boolean)
        .join(", ")}
    </span>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const [serverError, setServerError] = useState("")

  useEffect(() => {
    if (session) navigate({ to: "/" })
  }, [session, navigate])

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setServerError("")
      const result = await signIn.email(value)
      if (result.error) {
        setServerError(result.error.message ?? "Falha ao entrar")
      }
    },
  })

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-base-100 px-6 overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(15% 0.04 265), transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-8">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">walkie-talkie</h1>
          <p className="text-base-content/35 text-sm mt-2 font-medium">
            o seu segundo cérebro por voz
          </p>
        </div>

        {/* Glass form card */}
        <div className="rounded-2xl bg-base-200/60 backdrop-blur-md border border-base-content/10 p-6 flex flex-col gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="flex flex-col gap-4"
          >
            <form.Field name="email">
              {(field) => (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-base-content/40 font-medium uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    className="bg-base-100/50 border border-base-content/10 rounded-xl px-3.5 py-2.5 text-sm placeholder:text-base-content/25 outline-none focus:border-primary/40 transition-colors w-full"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="email"
                    placeholder="seu@email.com"
                  />
                  <FieldErrors field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-base-content/40 font-medium uppercase tracking-wider">
                    Senha
                  </label>
                  <input
                    type="password"
                    className="bg-base-100/50 border border-base-content/10 rounded-xl px-3.5 py-2.5 text-sm placeholder:text-base-content/25 outline-none focus:border-primary/40 transition-colors w-full"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <FieldErrors field={field} />
                </div>
              )}
            </form.Field>

            {serverError && (
              <div className="rounded-xl bg-error/10 border border-error/20 px-3.5 py-2.5 text-xs text-error">
                {serverError}
              </div>
            )}

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as [boolean, boolean]}>
              {([canSubmit, isSubmitting]: [boolean, boolean]) => (
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-content hover:opacity-90 transition-opacity disabled:opacity-50 mt-1"
                  disabled={!canSubmit}
                >
                  {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : "Entrar"}
                </button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </div>
    </div>
  )
}
