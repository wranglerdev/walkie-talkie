// legado
// export async function transcribeAudio(audioBlob: Blob, ai: Ai): Promise<string> {
//   const buffer = await audioBlob.arrayBuffer()
//   const audio = [...new Uint8Array(buffer)]

//   const result = await ai.run("@cf/openai/whisper", { audio })

//   return result.text ?? ""
// }

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ""
  const bytes = new Uint8Array(buffer)

  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

export async function transcribeAudio(
  audioBlob: Blob,
  ai: Ai,
): Promise<string> {
  try {
    const buffer = await audioBlob.arrayBuffer()

    const result = await ai.run("@cf/openai/whisper-large-v3-turbo", {
      audio: arrayBufferToBase64(buffer),
      language: 'pt'
      ,
    })

    return result?.text?.trim() ?? ""
  } catch (error) {
    console.error("Whisper transcription failed:", error)
    return ""
  }
}