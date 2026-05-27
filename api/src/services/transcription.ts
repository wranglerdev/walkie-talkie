export async function transcribeAudio(
  audioBlob: Blob,
  ai: Ai,
): Promise<string> {
  try {
    const buffer = await audioBlob.arrayBuffer()

    const result = await ai.run("@cf/openai/whisper", {
      audio: [...new Uint8Array(buffer)],
      source_lang: "pt",
    })

    return result?.text?.trim() ?? ""
  } catch (error) {
    console.error("Whisper transcription failed:", error)
    return ""
  }
}
