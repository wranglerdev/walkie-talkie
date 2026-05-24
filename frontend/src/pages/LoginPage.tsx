import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useForm, type AnyFieldApi } from "@tanstack/react-form"
import { loginSchema } from "@walkie-talkie/shared"
import { signIn } from "../lib/auth-client"

function FieldErrors({ field }: { field: AnyFieldApi }) {
  if (!field.state.meta.isTouched || field.state.meta.errors.length === 0) return null
  return (
    <span className="text-error text-sm mt-1">
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
  const [serverError, setServerError] = useState("")

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      setServerError("")
      const result = await signIn.email(value)
      if (result.error) {
        setServerError(result.error.message ?? "Falha ao entrar")
      } else {
        navigate({ to: "/" })
      }
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-2">walkie-talkie</h1>

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
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="email"
                  />
                  <FieldErrors field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Senha</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="current-password"
                  />
                  <FieldErrors field={field} />
                </div>
              )}
            </form.Field>

            {serverError && (
              <div className="alert alert-error text-sm py-2">
                <span>{serverError}</span>
              </div>
            )}

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as [boolean, boolean]}>
              {([canSubmit, isSubmitting]: [boolean, boolean]) => (
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
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
