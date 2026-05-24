import { useState, useRef, useCallback } from "react"

export type RecorderState = "idle" | "recording" | "processing" | "error"

export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle")
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      })
      chunksRef.current = []
      mediaRecorderRef.current = mediaRecorder
      startTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.start(100)
      setState("recording")
    } catch {
      setError("Permissão de microfone negada")
      setState("error")
    }
  }, [])

  const stopRecording = useCallback((): Promise<{ blob: Blob; duration: number } | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === "inactive") {
        resolve(null)
        return
      }

      const duration = Math.round((Date.now() - startTimeRef.current) / 1000)

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        recorder.stream.getTracks().forEach((t) => t.stop())
        mediaRecorderRef.current = null
        resolve({ blob, duration })
      }

      recorder.stop()
    })
  }, [])

  const setProcessing = useCallback(() => setState("processing"), [])
  const setIdle = useCallback(() => setState("idle"), [])

  return { state, error, startRecording, stopRecording, setProcessing, setIdle }
}
