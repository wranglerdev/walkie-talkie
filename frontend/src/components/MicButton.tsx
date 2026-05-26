import { Microphone } from "@phosphor-icons/react"
import type { RecorderState } from "../hooks/useRecorder"

type RecordMode = "idle" | "tap" | "hold"

type Props = {
  recorderState: RecorderState
  recordMode: RecordMode
  elapsed: number
  maxDuration: number
  onPointerDown: () => void
  onPointerUp: () => void
  onPointerLeave: () => void
}

const CX = 88
const CY = 88
const RADIUS = 76
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function MicButton({
  recorderState,
  recordMode,
  elapsed,
  maxDuration,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
}: Props) {
  const isProcessing = recorderState === "processing"
  const isRecording = recorderState === "recording"
  const isActive = isRecording && recordMode !== "idle"

  const isNearEnd = elapsed > maxDuration - 4_000
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(elapsed / maxDuration, 1))

  const ringClass = isActive
    ? "mic-ring-recording"
    : "mic-ring-idle"

  const buttonBg = isActive
    ? "bg-base-300"
    : "bg-base-200"

  const iconColor = isActive
    ? "text-secondary"
    : isProcessing
    ? "text-primary/60"
    : "text-base-content/70"

  const arcColor = isNearEnd
    ? "stroke-error"
    : isActive && recordMode === "tap"
    ? "stroke-secondary"
    : "stroke-warning"

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Outer ring */}
      <div
        className={[
          "absolute rounded-full pointer-events-none",
          ringClass,
        ].join(" ")}
        style={{ width: 176, height: 176 }}
        aria-hidden="true"
      />

      {/* SVG progress arc */}
      {isRecording && (
        <svg
          width={176}
          height={176}
          viewBox="0 0 176 176"
          className="absolute pointer-events-none"
          aria-hidden="true"
        >
          <circle
            cx={CX} cy={CY} r={RADIUS}
            fill="none" strokeWidth={3}
            className="stroke-base-300/40"
          />
          <circle
            cx={CX} cy={CY} r={RADIUS}
            fill="none" strokeWidth={3} strokeLinecap="round"
            className={arcColor}
            style={{
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: dashOffset,
              transform: "rotate(-90deg)",
              transformOrigin: `${CX}px ${CY}px`,
              transition: "stroke-dashoffset 0.1s linear",
            }}
          />
        </svg>
      )}

      {/* Core button */}
      <button
        className={[
          "relative flex items-center justify-center rounded-full select-none",
          "transition-colors duration-200",
          buttonBg,
          isProcessing ? "cursor-not-allowed opacity-75" : "cursor-pointer active:scale-95",
        ].join(" ")}
        style={{ width: 144, height: 144 }}
        onPointerDown={isProcessing ? undefined : onPointerDown}
        onPointerUp={isProcessing ? undefined : onPointerUp}
        onPointerLeave={isProcessing ? undefined : onPointerLeave}
        disabled={isProcessing}
        aria-label={
          isProcessing ? "Processando..." :
          recordMode === "tap" ? "Gravando — toque para parar" :
          recordMode === "hold" ? "Gravando — solte para parar" :
          "Segure ou toque para gravar"
        }
      >
        {isProcessing ? (
          <span className="loading loading-ring loading-lg text-primary" />
        ) : (
          <span className={["inline-flex transition-colors duration-200", iconColor].join(" ")}>
            <Microphone size={44} weight="fill" />
          </span>
        )}
      </button>
    </div>
  )
}
