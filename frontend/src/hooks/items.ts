import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, type Item, type ItemType } from "../api/client"

export const itemKeys = {
  all: () => ["items"] as const,
  lists: () => ["items", "list"] as const,
  list: (type?: ItemType) => ["items", "list", type] as const,
  detail: (id: string) => ["items", "detail", id] as const,
}

export function useItems(type?: ItemType) {
  return useQuery({
    queryKey: itemKeys.list(type),
    queryFn: () => api.items.list(type),
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => api.items.get(id),
  })
}

export function useUploadAudio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ blob, duration }: { blob: Blob; duration: number }) =>
      api.audio.upload(blob, duration),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.lists() }),
  })
}

export function usePatchItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Item> }) =>
      api.items.patch(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      qc.invalidateQueries({ queryKey: itemKeys.detail(id) })
    },
  })
}

export function useConfirmItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.items.confirm(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      qc.invalidateQueries({ queryKey: itemKeys.detail(id) })
    },
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.items.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
      qc.removeQueries({ queryKey: itemKeys.detail(id) })
    },
  })
}
