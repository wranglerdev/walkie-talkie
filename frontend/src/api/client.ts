export type ItemType = "reminder" | "note" | "bill" | "idea" | "shopping" | "journal"

export type Item = {
  id: string
  type: ItemType
  title: string
  transcript: string
  audioUrl: string | null
  createdAt: string
  updatedAt: string
  dueDate: string | null
  completed: boolean | null
  paid: boolean | null
  metadata: Record<string, unknown> | null
  status: "pending" | "confirmed"
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error: string }).error)
  }
  return res.json() as Promise<T>
}

export const api = {
  items: {
    list: (type?: ItemType) =>
      apiFetch<Item[]>(`/items${type ? `?type=${type}` : ""}`),

    get: (id: string) => apiFetch<Item>(`/items/${id}`),

    patch: (id: string, data: Partial<Item>) =>
      apiFetch<Item>(`/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/items/${id}`, { method: "DELETE" }),

    confirm: (id: string) =>
      apiFetch<Item>(`/items/${id}/confirm`, { method: "POST" }),
  },

  audio: {
    upload: async (blob: Blob, duration: number): Promise<Item> => {
      const form = new FormData()
      form.append("audio", blob, "audio.webm")
      form.append("duration", String(duration))
      form.append("clientNow", new Date().toISOString())
      const res = await fetch("/api/audio/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error((err as { error: string }).error)
      }
      return res.json() as Promise<Item>
    },
  },
}
