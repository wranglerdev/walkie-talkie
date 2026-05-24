export async function transcribeAudio(audioBlob: Blob, ai: Ai): Promise<string> {
  const buffer = await audioBlob.arrayBuffer()
  const audio = [...new Uint8Array(buffer)]

  const result = await ai.run("@cf/openai/whisper", { audio })

  return result.text ?? ""
}
