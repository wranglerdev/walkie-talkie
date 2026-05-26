import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../api/client"

export const contextKeys = {
  people: () => ["context", "people"] as const,
  projects: () => ["context", "projects"] as const,
  backlog: () => ["backlog"] as const,
}

export function useContextPeople() {
  return useQuery({
    queryKey: contextKeys.people(),
    queryFn: () => api.context.listPeople(),
  })
}

export function useCreatePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; expiresAt: string | null }) =>
      api.context.createPerson(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: contextKeys.people() }),
  })
}

export function useDeletePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.context.deletePerson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: contextKeys.people() }),
  })
}

export function useContextProjects() {
  return useQuery({
    queryKey: contextKeys.projects(),
    queryFn: () => api.context.listProjects(),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string }) => api.context.createProject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: contextKeys.projects() }),
  })
}

export function useToggleProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.context.toggleProject(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: contextKeys.projects() }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.context.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contextKeys.projects() })
      qc.invalidateQueries({ queryKey: contextKeys.backlog() })
    },
  })
}

export function useBacklog() {
  return useQuery({
    queryKey: contextKeys.backlog(),
    queryFn: () => api.items.backlog(),
  })
}
