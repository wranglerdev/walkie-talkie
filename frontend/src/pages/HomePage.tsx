import { useState, useEffect, useCallback } from "react"
import { useRecorder } from "../hooks/useRecorder"
import { api, type Item } from "../api/client"
import MicButton from "../components/MicButton"
import ItemCard from "../components/ItemCard"

export default function HomePage() {
  const { state, error, startRecording, stopRecording, setProcessing, setIdle } = useRecorder()
  const [lastItem, setLastItem] = useState<Item | null>(null)

  useEffect(() => {
    api.items.list().then((items) => {
      if (items.length > 0) setLastItem(items[0])
    })
  }, [])

  const handlePointerDown = useCallback(async () => {
    await startRecording()
  }, [startRecording])

  const handlePointerUp = useCallback(async () => {
    const result = await stopRecording()
    if (!result) return
    setProcessing()
    try {
      const item = await api.audio.upload(result.blob, result.duration)
      setLastItem(item)
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setIdle()
    }
  }, [stopRecording, setProcessing, setIdle])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 pb-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-1">walkie-talkie</h1>
        <p className="text-base-content/50 text-sm">
          {state === "idle" && "Segure para gravar"}
          {state === "recording" && "Gravando..."}
          {state === "processing" && "Processando..."}
          {state === "error" && (error ?? "Erro ao gravar")}
        </p>
      </div>

      <MicButton
        recorderState={state}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />

      {lastItem && (
        <div className="w-full max-w-sm">
          <p className="text-xs text-base-content/40 mb-2 text-center uppercase tracking-wider">
            Último salvo
          </p>
          <ItemCard item={lastItem} compact />
        </div>
      )}

      {!lastItem && state === "idle" && (
        <p className="text-base-content/30 text-sm text-center max-w-xs">
          Grave um lembrete, nota, conta ou ideia. A IA organiza automaticamente.
        </p>
      )}
    </div>
  )
}
