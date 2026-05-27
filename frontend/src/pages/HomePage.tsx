import { useState, useCallback, useRef, useEffect } from "react"
import { Microphone, PaperPlaneTilt, X } from "@phosphor-icons/react"
import { useRecorder } from "../hooks/useRecorder"
import { useItems, useUploadAudio } from "../hooks/items"
import type { Item } from "../api/client"
import AudioWaveform from "../components/AudioWaveform"
import ItemCard from "../components/ItemCard"
import PendingReview from "../components/PendingReview"

const MIN_SEND_MS = 1_500
const MAX_DURATION = 20_000

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, "0")}`
}

export default function HomePage() {
  const {
    state, error, elapsed, analyser,
    startRecording, stopRecording,
    setProcessing, setIdle,
    setAutoStopCallback,
  } = useRecorder()

  const [pendingItem, setPendingItem] = useState<Item | null>(null)
  const { data: items } = useItems()
  const lastItem = pendingItem ? null : (items?.[0] ?? null)
  const uploadAudio = useUploadAudio()

  const submitRecording = useCallback(async () => {
    const result = await stopRecording()
    if (!result) return
    setProcessing()
    try {
      const item = await uploadAudio.mutateAsync({ blob: result.blob, duration: result.duration })
      setPendingItem(item)
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setIdle()
    }
  }, [stopRecording, setProcessing, setIdle, uploadAudio])

  const submitRef = useRef(submitRecording)
  submitRef.current = submitRecording

  useEffect(() => {
    setAutoStopCallback(() => submitRef.current())
  }, [setAutoStopCallback])

  const cancelRecording = useCallback(async () => {
    await stopRecording()
    setIdle()
  }, [stopRecording, setIdle])

  const canSend = elapsed >= MIN_SEND_MS
  const isRecording = state === "recording"
  const isProcessing = state === "processing"

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 pt-12 pb-20">

      {/* Wordmark */}
      <p className="text-base-content/25 text-xs tracking-widest uppercase font-medium">
        walkie-talkie
      </p>

      {/* Main content — changes per state */}
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">

        {/* ── RECORDING ── */}
        {isRecording && analyser && (
          <>
            {/* Waveform card */}
            <div className="w-full rounded-2xl bg-base-200 px-4 pt-4 pb-3 flex flex-col gap-2">
              <AudioWaveform analyser={analyser} />
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                <span className="text-xs font-mono text-base-content/50 tabular-nums">
                  {formatElapsed(elapsed)}
                </span>
                <span className="text-xs text-base-content/30">
                  / {formatElapsed(MAX_DURATION)}
                </span>
              </div>
            </div>

            {/* Send button — disabled until MIN_SEND_MS */}
            <button
              onClick={submitRecording}
              disabled={!canSend}
              className="btn btn-primary w-full gap-3 text-base"
            >
              <span className="inline-flex">
                <PaperPlaneTilt size={20} weight="fill" />
              </span>
              Enviar
            </button>

            {/* Cancel */}
            <button
              onClick={cancelRecording}
              className="btn btn-ghost btn-sm text-base-content/40 gap-2"
            >
              <span className="inline-flex">
                <X size={14} weight="bold" />
              </span>
              Cancelar
            </button>
          </>
        )}

        {/* ── PROCESSING ── */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-ring loading-lg text-primary" />
            <p className="text-sm text-base-content/40 font-medium">Processando...</p>
          </div>
        )}

        {/* ── IDLE / ERROR ── */}
        {!isRecording && !isProcessing && (
          <>
            {state === "error" && (
              <p className="text-sm text-error text-center">{error ?? "Erro ao gravar"}</p>
            )}

            <button
              onClick={startRecording}
              className="btn btn-primary btn-lg gap-3 px-10 rounded-2xl"
            >
              <span className="inline-flex">
                <Microphone size={24} weight="fill" />
              </span>
              Gravar
            </button>

            <p className="text-xs text-base-content/30">
              Toque para gravar um lembrete, nota, conta ou ideia
            </p>
          </>
        )}
      </div>

      {/* Bottom slot — pending review or last item */}
      <div className="w-full max-w-sm">
        {pendingItem && (
          <PendingReview
            item={pendingItem}
            onConfirmed={() => setPendingItem(null)}
            onDiscarded={() => setPendingItem(null)}
          />
        )}

        {!pendingItem && lastItem && !isRecording && !isProcessing && (
          <div>
            <p className="text-[10px] text-base-content/25 mb-2 text-center uppercase tracking-widest font-medium">
              Último registro
            </p>
            <ItemCard item={lastItem} compact />
          </div>
        )}
      </div>

    </div>
  )
}
