import { useState } from "react"

export type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  reasoning?: string
  isStreaming?: boolean
}

export type ChatSession = {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

export type GenerationOptions = {
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  repeatPenalty?: number
  systemPrompt?: string
}

export function useChats() {
  const [chats, setChats] = useState<ChatSession[]>([
    {
      id: "1",
      title: "Новый чат",
      messages: [],
      createdAt: Date.now(),
    },
  ])
  const [activeChatId, setActiveChatId] = useState<string>("1")
  const [isLoading, setIsLoading] = useState(false)

  const activeChat = chats.find((c: ChatSession) => c.id === activeChatId) || chats[0]
  const currentMessages = activeChat ? activeChat.messages : []

  const handleNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: "Новый чат",
      messages: [],
      createdAt: Date.now(),
    }
    setChats((prev: ChatSession[]) => [newChat, ...prev])
    setActiveChatId(newChat.id)
  }

  const handleDeleteChat = (id: string) => {
    setChats((prev: ChatSession[]) => {
      const filtered = prev.filter((c: ChatSession) => c.id !== id)
      if (filtered.length === 0) {
        const fresh: ChatSession = { id: Date.now().toString(), title: "Новый чат", messages: [], createdAt: Date.now() }
        setActiveChatId(fresh.id)
        return [fresh]
      }
      if (activeChatId === id) {
        setActiveChatId(filtered[0].id)
      }
      return filtered
    })
  }

  const sendMessage = async (
    text: string,
    model: string,
    useReasoning: boolean,
    options?: GenerationOptions
  ) => {
    if (!text.trim() || isLoading) return

    const userMessageId = Date.now().toString()
    const assistantMessageId = (Date.now() + 1).toString()

    const userMessage: Message = { id: userMessageId, role: "user", content: text }
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      reasoning: "",
      isStreaming: true,
    }

    setChats((prev: ChatSession[]) =>
      prev.map((chat: ChatSession) => {
        if (chat.id === activeChatId) {
          const title = chat.messages.length === 0 ? text.slice(0, 30) + "..." : chat.title
          return {
            ...chat,
            title,
            messages: [...chat.messages, userMessage, initialAssistantMessage],
          }
        }
        return chat
      })
    )

    setIsLoading(true)

    try {
      const apiMessages = [
        ...(options?.systemPrompt
          ? [{ role: "system", content: options.systemPrompt }]
          : []),
        ...activeChat.messages.map((m: Message) => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ]

      const response = await fetch("http://localhost:8080/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          messages: apiMessages,
          stream: true,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2048,
          top_p: options?.topP ?? 0.9,
          ...(options?.repeatPenalty ? { repeat_penalty: options.repeatPenalty } : {}),
        }),
      })

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder("utf-8")

      if (!reader) throw new Error("ReadableStream недоступен")

      let accumulatedContent = ""
      let accumulatedReasoning = ""
      let inThinkBlock = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data:")) continue
          const dataStr = trimmed.slice(5).trim()
          if (dataStr === "[DONE]") break

          try {
            const parsed = JSON.parse(dataStr)
            const delta = parsed.choices?.[0]?.delta?.content || ""
            
            if (delta) {
              accumulatedContent += delta

              if (useReasoning) {
                if (accumulatedContent.includes("<think>")) {
                  inThinkBlock = true
                  accumulatedContent = accumulatedContent.replace("<think>", "")
                }
                if (accumulatedContent.includes("</think>")) {
                  inThinkBlock = false
                  const parts = accumulatedContent.split("</think>")
                  accumulatedReasoning += parts[0]
                  accumulatedContent = parts[1] || ""
                } else if (inThinkBlock) {
                  accumulatedReasoning += delta
                  accumulatedContent = accumulatedContent.replace(delta, "")
                }
              }

              setChats((prev: ChatSession[]) =>
                prev.map((chat: ChatSession) => {
                  if (chat.id === activeChatId) {
                    return {
                      ...chat,
                      messages: chat.messages.map((m: Message) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              content: accumulatedContent,
                              reasoning: accumulatedReasoning,
                            }
                          : m
                      ),
                    }
                  }
                  return chat
                })
              )
            }
          } catch (e) {
            // Игнорируем неполные JSON-фрагменты
          }
        }
      }
    } catch (error) {
      console.error("Ошибка при генерации ответа:", error)
      setChats((prev: ChatSession[]) =>
        prev.map((chat: ChatSession) => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: chat.messages.map((m: Message) =>
                m.id === assistantMessageId
                  ? { ...m, content: "⚠️ Ошибка подключения к локальному серверу llama.cpp." }
                  : m
              ),
            }
          }
          return chat
        })
      )
    } finally {
      setIsLoading(false)
      setChats((prev: ChatSession[]) =>
        prev.map((chat: ChatSession) => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: chat.messages.map((m: Message) =>
                m.id === assistantMessageId ? { ...m, isStreaming: false } : m
              ),
            }
          }
          return chat
        })
      )
    }
  }

  return {
    chats,
    activeChatId,
    setActiveChatId,
    currentMessages,
    isLoading,
    handleNewChat,
    handleDeleteChat,
    sendMessage,
  }
}