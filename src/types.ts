export type HuggingFaceModel = {
  id: string
  modelId: string
  downloads: number
  likes: number
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  reasoning?: string
  isStreaming?: boolean
}