import OpenAI from "openai"

export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string,
): Promise<string> {
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  })

  const file = new File([audioBlob], "audio.webm", { type: "audio/webm" })

  const transcription = await client.audio.transcriptions.create({
    model: "x-ai/grok-2-vision-1212",
    file,
    language: "pt",
    response_format: "text",
  })

  return typeof transcription === "string" ? transcription : transcription.text
}
