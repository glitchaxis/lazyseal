import { useState, useEffect } from "react"
import {
  fetchChatsFromDb,
  createChatInDb,
  deleteChatFromDb,
  fetchMessagesFromDb,
  saveMessageToDb,
  updateMessageContentInDb,
  updateChatTitleInDb,
} from "@/db"

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
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Функция создания нового чата
  const createNewChat = async (): Promise<ChatSession> => {
    const newId = Date.now().toString()
    const newTitle = "Новый чат"
    const newTimestamp = Date.now()

    await createChatInDb(newId, newTitle)

    const newChat: ChatSession = {
      id: newId,
      title: newTitle,
      messages: [],
      createdAt: newTimestamp,
    }

    return newChat
  }

  // 1. Инициализация базы данных при первом запуске
  useEffect(() => {
    let isMounted = true

    async function initDbData() {
      try {
        const dbChats = await fetchChatsFromDb()

        if (dbChats.length > 0) {
          const loadedSessions: ChatSession[] = await Promise.all(
            dbChats.map(async (c) => {
              const msgs = await fetchMessagesFromDb(c.id)
              return {
                id: c.id,
                title: c.title,
                createdAt: c.created_at,
                messages: msgs.map((m) => ({
                  id: m.id,
                  role: m.role as "user" | "assistant" | "system",
                  content: m.content,
                  reasoning: m.reasoning || undefined,
                })),
              }
            })
          )

          if (isMounted) {
            setChats(loadedSessions)
            setActiveChatId(loadedSessions[0].id)
          }
        } else {
          // Если БД пустая — создаем дефолтный чат
          const freshChat = await createNewChat()
          if (isMounted) {
            setChats([freshChat])
            setActiveChatId(freshChat.id)
          }
        }
      } catch (err) {
        console.error("Ошибка загрузки данных из SQLite:", err)
        // Фолбэк на случай ошибки подключения к SQLite
        const fallbackId = Date.now().toString()
        const fallbackChat: ChatSession = {
          id: fallbackId,
          title: "Новый чат",
          messages: [],
          createdAt: Date.now(),
        }
        if (isMounted) {
          setChats([fallbackChat])
          setActiveChatId(fallbackId)
        }
      }
    }

    initDbData()

    return () => {
      isMounted = false
    }
  }, [])

  // Текущий активный чат и его сообщения
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0]
  const currentMessages = activeChat ? activeChat.messages : []

  // Создание нового чата кнопкой '+'
  const handleNewChat = async () => {
    try {
      const newChat = await createNewChat()
      setChats((prev) => [newChat, ...prev])
      setActiveChatId(newChat.id)
    } catch (err) {
      console.error("Ошибка создания чата:", err)
    }
  }

  // Удаление чата
  const handleDeleteChat = async (id: string) => {
    try {
      await deleteChatFromDb(id)

      setChats((prev) => {
        const filtered = prev.filter((c) => c.id !== id)
        if (filtered.length === 0) {
          createNewChat().then((fresh) => {
            setChats([fresh])
            setActiveChatId(fresh.id)
          })
          return []
        }
        if (activeChatId === id) {
          setActiveChatId(filtered[0].id)
        }
        return filtered
      })
    } catch (err) {
      console.error("Ошибка удаления чата из SQLite:", err)
    }
  }

  // Отправка сообщения
  const sendMessage = async (
    text: string,
    model: string,
    useReasoning: boolean,
    options?: GenerationOptions
  ) => {
    const targetChatId = activeChatId || (chats[0] ? chats[0].id : null)
    if (!text.trim() || isLoading || !targetChatId) return

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

    let updatedTitle: string | null = null
    const targetChat = chats.find((c) => c.id === targetChatId)
    if (targetChat && targetChat.messages.length === 0) {
      updatedTitle = text.slice(0, 30) + (text.length > 30 ? "..." : "")
    }

    if (updatedTitle) {
      try {
        await updateChatTitleInDb(targetChatId, updatedTitle)
      } catch (e) {
        console.error(e)
      }
    }

    try {
      await saveMessageToDb(userMessageId, targetChatId, "user", text)
      await saveMessageToDb(assistantMessageId, targetChatId, "assistant", "")
    } catch (e) {
      console.error("Ошибка сохранения в БД:", e)
    }

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === targetChatId) {
          return {
            ...chat,
            title: updatedTitle || chat.title,
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
        ...(targetChat ? targetChat.messages : []).map((m) => ({
          role: m.role,
          content: m.content,
        })),
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

              setChats((prev) =>
                prev.map((chat) => {
                  if (chat.id === targetChatId) {
                    return {
                      ...chat,
                      messages: chat.messages.map((m) =>
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

      try {
        await updateMessageContentInDb(assistantMessageId, accumulatedContent, accumulatedReasoning)
      } catch (e) {
        console.error(e)
      }
    } catch (error) {
      console.error("Ошибка при генерации ответа:", error)
      const errorMsg = "⚠️ Ошибка подключения к локальному серверу llama.cpp."

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === targetChatId) {
            return {
              ...chat,
              messages: chat.messages.map((m) =>
                m.id === assistantMessageId ? { ...m, content: errorMsg } : m
              ),
            }
          }
          return chat
        })
      )
      try {
        await updateMessageContentInDb(assistantMessageId, errorMsg)
      } catch (e) {
        console.error(e)
      }
    } finally {
      setIsLoading(false)

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === targetChatId) {
            return {
              ...chat,
              messages: chat.messages.map((m) =>
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