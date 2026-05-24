import type { RecorderState } from "../hooks/useRecorder"

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
    <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 10z" />
  </svg>
)

type Props = {
  recorderState: RecorderState
  onPointerDown: () => void
  onPointerUp: () => void
}

export default function MicButton({ recorderState, onPointerDown, onPointerUp }: Props) {
  const isRecording = recorderState === "recording"
  const isProcessing = recorderState === "processing"
  const isDisabled = isProcessing

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-error opacity-40 animate-ping" />
      )}
      <button
        className={[
          "btn btn-circle w-24 h-24 text-primary-content shadow-lg",
          isRecording ? "btn-error ring-4 ring-error ring-offset-2 ring-offset-base-100" : "btn-primary",
          isDisabled ? "cursor-not-allowed opacity-75" : "",
        ].join(" ")}
        onPointerDown={isDisabled ? undefined : onPointerDown}
        onPointerUp={isDisabled ? undefined : onPointerUp}
        onPointerLeave={isDisabled ? undefined : onPointerUp}
        disabled={isDisabled}
        aria-label={isRecording ? "Gravando — solte para parar" : "Segure para gravar"}
      >
        {isProcessing ? (
          <span className="loading loading-ring loading-lg" />
        ) : (
          <MicIcon />
        )}
      </button>
    </div>
  )
}
