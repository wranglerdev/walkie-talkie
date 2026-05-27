import { useRef, useEffect } from "react"

type Props = {
  analyser: AnalyserNode
}

export default function AudioWaveform({ analyser }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    let rafId: number

    function draw() {
      rafId = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      const W = canvas!.width
      const H = canvas!.height
      ctx!.clearRect(0, 0, W, H)

      const slotW = W / bufferLength
      const barW = Math.max(2, slotW * 0.55)
      const offsetX = (slotW - barW) / 2

      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i] / 255
        const barH = Math.max(4, value * H * 0.88)
        const x = i * slotW + offsetX
        const y = H - barH

        ctx!.globalAlpha = 0.45 + value * 0.55
        ctx!.fillStyle = "#f59e0b"
        ctx!.beginPath()
        // roundRect with fallback
        const radius = Math.min(3, barW / 2)
        ctx!.moveTo(x + radius, y)
        ctx!.lineTo(x + barW - radius, y)
        ctx!.quadraticCurveTo(x + barW, y, x + barW, y + radius)
        ctx!.lineTo(x + barW, y + barH)
        ctx!.lineTo(x, y + barH)
        ctx!.lineTo(x, y + radius)
        ctx!.quadraticCurveTo(x, y, x + radius, y)
        ctx!.closePath()
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [analyser])

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={96}
      className="w-full"
      style={{ height: "6rem" }}
    />
  )
}
