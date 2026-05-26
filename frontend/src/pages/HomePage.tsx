import { useState, useCallback, useRef, useEffect } from "react"
import { useRecorder } from "../hooks/useRecorder"
import { useItems, useUploadAudio } from "../hooks/items"
import type { Item } from "../api/client"
import MicButton from "../components/MicButton"
import ItemCard from "../components/ItemCard"
import PendingReview from "../components/PendingReview"

const TAP_THRESHOLD = 400
const MIN_DURATION  = 1_500
const MAX_DURATION  = 20_000

function statusText(
  state: string,
  recordMode: string,
  tooShort: boolean,
  error: string | null,
): string {
  if (state === "error")      return error ?? "Erro ao gravar"
  if (state === "processing") return "Processando..."
  if (state === "recording") {
    if (recordMode === "tap")  return tooShort ? "Continue gravando..." : "IA ouvindo..."
    if (recordMode === "hold") return tooShort ? "Continue segurando..." : "Gravando..."
  }
  return "Segure ou toque para gravar"
}

export default function HomePage() {
  const {
    state, error, elapsed,
    startRecording, stopRecording,
    setProcessing, setIdle,
    setAutoStopCallback,
  } = useRecorder()

  const [pendingItem, setPendingItem] = useState<Item | null>(null)
  const [recordMode, setRecordMode] = useState<"idle" | "tap">("idle")
  const [tooShort, setTooShort] = useState(false)
  const pressStartRef = useRef<number>(0)

  const { data: items } = useItems()
  const lastItem = pendingItem ? null : (items?.[0] ?? null)
  const uploadAudio = useUploadAudio()

  const submitRecording = useCallback(async () => {
    setRecordMode("idle")
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

  const showTooShort = useCallback(() => {
    setTooShort(true)
    setTimeout(() => setTooShort(false), 1500)
  }, [])

  const handlePointerDown = useCallback(async () => {
    if (state === "processing") return
    if (recordMode === "tap") {
      if (elapsed < MIN_DURATION) { showTooShort(); return }
      await submitRecording()
      return
    }
    pressStartRef.current = Date.now()
    await startRecording()
  }, [state, recordMode, elapsed, startRecording, submitRecording, showTooShort])

  const handlePointerUp = useCallback(async () => {
    if (state !== "recording" || recordMode === "tap") return
    const held = Date.now() - pressStartRef.current
    if (held < TAP_THRESHOLD) { setRecordMode("tap"); return }
    if (elapsed < MIN_DURATION) { setRecordMode("tap"); showTooShort(); return }
    await submitRecording()
  }, [state, recordMode, elapsed, submitRecording, showTooShort])

  function handleConfirmed() { setPendingItem(null) }
  function handleDiscarded() { setPendingItem(null) }

  const visualMode =
    state === "recording" && recordMode === "tap" ? "tap" :
    state === "recording" ? "hold" :
    "idle"

  const status = statusText(state, visualMode, tooShort, error)
  const isRecordingActive = state === "recording"

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 pt-12 pb-20">
      {/* Wordmark */}
      <p className="text-base-content/25 text-xs tracking-widest uppercase font-medium">
        walkie-talkie
      </p>

      {/* Hero: mic + status */}
      <div className="flex flex-col items-center gap-7">
        <MicButton
          recorderState={state}
          recordMode={visualMode}
          elapsed={elapsed}
          maxDuration={MAX_DURATION}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        <p
          className={[
            "text-sm font-medium transition-all duration-300 text-center",
            isRecordingActive ? "text-base-content/80" : "text-base-content/40",
          ].join(" ")}
        >
          {status}
        </p>
      </div>

      {/* Bottom slot */}
      <div className="w-full max-w-sm">
        {pendingItem && (
          <PendingReview
            item={pendingItem}
            onConfirmed={handleConfirmed}
            onDiscarded={handleDiscarded}
          />
        )}

        {!pendingItem && lastItem && (
          <div>
            <p className="text-[10px] text-base-content/25 mb-2 text-center uppercase tracking-widest font-medium">
              Último registro
            </p>
            <ItemCard item={lastItem} compact />
          </div>
        )}

        {!pendingItem && !lastItem && state === "idle" && (
          <p className="text-base-content/20 text-xs text-center">
            Grave um lembrete, nota, conta ou ideia
          </p>
        )}
      </div>
    </div>
  )
}
