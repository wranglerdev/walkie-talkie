import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { Timer, X, Plus, Users, FolderSimple } from "@phosphor-icons/react"
import {
  useContextPeople,
  useCreatePerson,
  useDeletePerson,
  useContextProjects,
  useCreateProject,
  useToggleProject,
  useDeleteProject,
} from "../hooks/context"

const EXPIRY_OPTIONS: { label: string; days: number | null }[] = [
  { label: "1 dia",    days: 1 },
  { label: "1 semana", days: 7 },
  { label: "15 dias",  days: 15 },
  { label: "1 mês",    days: 30 },
  { label: "3 meses",  days: 90 },
  { label: "Sempre",   days: null },
]

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "Sempre"
  const d = new Date(expiresAt)
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return "Expirado"
  if (diff === 1) return "Amanhã"
  return `${diff} dias`
}

function PeopleSection() {
  const { data: people = [], isLoading } = useContextPeople()
  const createPerson = useCreatePerson()
  const deletePerson = useDeletePerson()
  const [selectedDays, setSelectedDays] = useState<number | null | undefined>(undefined)

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      if (selectedDays === undefined) return
      const expiresAt = selectedDays !== null ? addDays(selectedDays) : null
      await createPerson.mutateAsync({ name: value.name.trim(), expiresAt })
      form.reset()
      setSelectedDays(undefined)
    },
  })

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary"><Users size={16} weight="fill" /></span>
        <h3 className="text-sm font-semibold">Pessoas no contexto</h3>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
        className="flex flex-col gap-3 mb-5"
      >
        <form.Field name="name">
          {(field) => (
            <input
              className="w-full bg-base-200 border border-base-content/10 rounded-xl px-3.5 py-2.5 text-sm placeholder:text-base-content/30 outline-none focus:border-primary/40 transition-colors"
              placeholder="Nome da pessoa"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>

        <div>
          <p className="text-xs text-base-content/35 mb-2">Duração no contexto</p>
          <div className="flex flex-wrap gap-1.5">
            {EXPIRY_OPTIONS.map((opt) => {
              const active = selectedDays === opt.days
              return (
                <button
                  key={opt.label}
                  type="button"
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium border transition-all duration-150",
                    active
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-base-200 border-transparent text-base-content/40 hover:text-base-content/70",
                  ].join(" ")}
                  onClick={() => setSelectedDays(opt.days)}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-content hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={createPerson.isPending || selectedDays === undefined}
        >
          {createPerson.isPending
            ? <span className="loading loading-spinner loading-xs" />
            : <><Plus size={14} weight="bold" /> Adicionar pessoa</>
          }
        </button>
      </form>

      {isLoading && <span className="loading loading-ring loading-sm text-primary" />}

      <ul className="flex flex-col gap-2">
        {people.map((p) => (
          <li key={p.id} className="flex items-center justify-between bg-base-200 rounded-xl px-3.5 py-2.5 border border-base-content/8">
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm">{p.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="flex items-center gap-1 text-xs text-base-content/35">
                <Timer size={12} weight="fill" />
                {formatExpiry(p.expiresAt)}
              </span>
              <button
                className="text-base-content/25 hover:text-error transition-colors p-1 rounded-lg hover:bg-error/10"
                onClick={() => deletePerson.mutate(p.id)}
                aria-label={`Remover ${p.name}`}
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </li>
        ))}
        {!isLoading && people.length === 0 && (
          <p className="text-xs text-base-content/30">Nenhuma pessoa no contexto.</p>
        )}
      </ul>
    </section>
  )
}

function ProjectsSection() {
  const { data: projects = [], isLoading } = useContextProjects()
  const createProject = useCreateProject()
  const toggleProject = useToggleProject()
  const deleteProject = useDeleteProject()

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      await createProject.mutateAsync({ name: value.name.trim() })
      form.reset()
    },
  })

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary"><FolderSimple size={16} weight="fill" /></span>
        <h3 className="text-sm font-semibold">Projetos</h3>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
        className="flex gap-2 mb-5"
      >
        <form.Field name="name">
          {(field) => (
            <input
              className="flex-1 bg-base-200 border border-base-content/10 rounded-xl px-3.5 py-2.5 text-sm placeholder:text-base-content/30 outline-none focus:border-primary/40 transition-colors"
              placeholder="Nome do projeto"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <button
          type="submit"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-content hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
          disabled={createProject.isPending}
          aria-label="Adicionar projeto"
        >
          {createProject.isPending
            ? <span className="loading loading-spinner loading-xs" />
            : <Plus size={16} weight="bold" />
          }
        </button>
      </form>

      {isLoading && <span className="loading loading-ring loading-sm text-primary" />}

      <ul className="flex flex-col gap-2">
        {projects.map((p) => (
          <li key={p.id} className="flex items-center justify-between bg-base-200 rounded-xl px-3.5 py-2.5 border border-base-content/8">
            <span className={["font-medium text-sm", !p.active ? "text-base-content/30 line-through" : ""].join(" ")}>
              {p.name}
            </span>
            <div className="flex items-center gap-2">
              <button
                className={[
                  "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all duration-150",
                  p.active
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-error/15 hover:border-error/30 hover:text-error"
                    : "bg-base-300 border-transparent text-base-content/35 hover:bg-primary/15 hover:border-primary/30 hover:text-primary",
                ].join(" ")}
                onClick={() => toggleProject.mutate({ id: p.id, active: !p.active })}
              >
                {p.active ? "Ativo" : "Inativo"}
              </button>
              <button
                className="text-base-content/25 hover:text-error transition-colors p-1 rounded-lg hover:bg-error/10"
                onClick={() => deleteProject.mutate(p.id)}
                aria-label={`Remover ${p.name}`}
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </li>
        ))}
        {!isLoading && projects.length === 0 && (
          <p className="text-xs text-base-content/30">Nenhum projeto cadastrado.</p>
        )}
      </ul>
    </section>
  )
}

export default function ContextPage() {
  return (
    <div className="flex-1 flex flex-col pb-20 px-4">
      <p className="text-[10px] text-base-content/25 pt-5 pb-5 text-center uppercase tracking-widest font-medium">
        Contexto
      </p>
      <PeopleSection />
      <div className="my-6 h-px bg-base-content/8" />
      <ProjectsSection />
    </div>
  )
}
