import { describe, it, expect } from "vitest"
import { validateAudioFile } from "../routes/audio"

const WEBM_MAGIC = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x02, 0x03, 0x04])

function makeFile(opts: { size?: number; type: string; bytes?: Uint8Array }): File {
  const data = opts.bytes ?? new Uint8Array(opts.size ?? 100)
  return new File([data], "test", { type: opts.type })
}

describe("validateAudioFile", () => {
  it("rejects non-audio MIME type", async () => {
    const file = makeFile({ type: "video/mp4" })
    const result = await validateAudioFile(file)
    expect(result.valid).toBe(false)
    expect(result.status).toBe(415)
  })

  it("rejects image disguised as audio", async () => {
    const file = makeFile({ type: "image/png" })
    const result = await validateAudioFile(file)
    expect(result.valid).toBe(false)
    expect(result.status).toBe(415)
  })

  it("rejects oversized file", async () => {
    const file = makeFile({ type: "audio/webm", bytes: WEBM_MAGIC })
    Object.defineProperty(file, "size", { value: 26 * 1024 * 1024 })
    const result = await validateAudioFile(file)
    expect(result.valid).toBe(false)
    expect(result.status).toBe(413)
  })

  it("rejects audio/webm with wrong magic bytes", async () => {
    const file = makeFile({ type: "audio/webm", bytes: new Uint8Array([0x00, 0x00, 0x00, 0x00]) })
    const result = await validateAudioFile(file)
    expect(result.valid).toBe(false)
    expect(result.status).toBe(415)
  })

  it("accepts valid audio/webm with correct magic bytes", async () => {
    const file = makeFile({ type: "audio/webm", bytes: WEBM_MAGIC })
    const result = await validateAudioFile(file)
    expect(result.valid).toBe(true)
  })

  it("accepts audio/webm with codec suffix", async () => {
    const file = makeFile({ type: "audio/webm;codecs=opus", bytes: WEBM_MAGIC })
    const result = await validateAudioFile(file)
    expect(result.valid).toBe(true)
  })
})
