import { z } from "zod"

export const createPersonSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  expiresAt: z.string().nullable().optional(),
})

export type CreatePerson = z.infer<typeof createPersonSchema>

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
})

export type CreateProject = z.infer<typeof createProjectSchema>
