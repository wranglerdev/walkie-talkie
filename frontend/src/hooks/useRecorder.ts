import { useState, useRef, useCallback, useEffect } from "react"

export type RecorderState = "idle" | "recording" | "processing" | "error"

const MAX_DURATION = 20_000

export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopCallbackRef = useRef<(() => void) | null>(null)

  const setAutoStopCallback = useCallback((cb: () => void) => {
    autoStopCallbackRef.current = cb
  }, [])

  const clearTicker = useCallback(() => {
    if (tickerRef.current !== null) {
      clearInterval(tickerRef.current)
      tickerRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setElapsed(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyserNode = audioContext.createAnalyser()
      analyserNode.fftSize = 64
      analyserNode.smoothingTimeConstant = 0.8
      source.connect(analyserNode)
      audioContextRef.current = audioContext
      setAnalyser(analyserNode)

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

      tickerRef.current = setInterval(() => {
        const ms = Date.now() - startTimeRef.current
        setElapsed(ms)
        if (ms >= MAX_DURATION) {
          clearInterval(tickerRef.current!)
          tickerRef.current = null
          autoStopCallbackRef.current?.()
        }
      }, 50)
    } catch {
      setError("Permissão de microfone negada")
      setState("error")
    }
  }, [clearTicker])

  const stopRecording = useCallback((): Promise<{ blob: Blob; duration: number } | null> => {
    clearTicker()
    setAnalyser(null)
    audioContextRef.current?.close()
    audioContextRef.current = null

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
  }, [clearTicker])

  const setProcessing = useCallback(() => setState("processing"), [])

  const setIdle = useCallback(() => {
    setState("idle")
    setElapsed(0)
  }, [])

  useEffect(() => {
    return () => {
      clearTicker()
      audioContextRef.current?.close()
    }
  }, [clearTicker])

  return {
    state, error, elapsed, analyser,
    startRecording, stopRecording,
    setProcessing, setIdle, setAutoStopCallback,
  }
}
