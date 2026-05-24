import { z } from "zod"

export const itemPatchSchema = z
  .object({
    title: z.string().min(1).optional(),
    completed: z.boolean().nullable().optional(),
    paid: z.boolean().nullable().optional(),
    dueDate: z.union([z.string(), z.null()]).optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    "Pelo menos um campo é necessário",
  )

export type ItemPatch = z.infer<typeof itemPatchSchema>
