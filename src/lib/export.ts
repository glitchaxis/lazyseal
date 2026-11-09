import { toast } from "@/components/ui/toast"
import { ChatMessage } from "@/types"
import { save } from "@tauri-apps/plugin-dialog"
import { writeTextFile, readFile, writeFile } from "@tauri-apps/plugin-fs"
import { appLocalDataDir, join } from "@tauri-apps/api/path"
import { getDatabase } from "@/db"

async function saveFileNative(content: string, defaultFilename: string, extension: string) {
  try {
    const filePath = await save({
      defaultPath: defaultFilename,
      filters: [{
        name: extension.toUpperCase(),
        extensions: [extension]
      }]
    })

    if (filePath) {
      await writeTextFile(filePath, content)
      toast.add({
        title: "Успешный экспорт",
        description: `Файл сохранен: ${filePath}`,
        type: "success",
      })
    }
  } catch (error: any) {
    console.error("Ошибка при сохранении файла:", error)
    toast.add({
      title: "Ошибка экспорта",
      description: error?.message || "Не удалось сохранить файл на диск",
      type: "error",
    })
  }
}

export function exportChatToMarkdown(title: string, messages: ChatMessage[]) {
  if (!messages || messages.length === 0) {
    toast.add({
      title: "Экспорт недоступен",
      description: "Нет сообщений для экспорта",
      type: "warning",
    })
    return
  }

  let mdContent = `# ${title}\n\n`
  mdContent += `*Экспортировано из LazySeal: ${new Date().toLocaleString()}*\n\n---\n\n`

  messages.forEach((msg) => {
    const roleName = msg.role === "user" ? "Пользователь" : "Агент"
    mdContent += `### ${roleName}\n\n`

    if (msg.reasoning) {
      mdContent += `> **Размышления:**\n> ${msg.reasoning.replace(/\n/g, "\n> ")}\n\n`
    }

    mdContent += `${msg.content}\n\n---\n\n`
  })

  const safeFilename = title.toLowerCase().replace(/[^a-z0-9а-яё]/gi, "_") || "chat_export"
  saveFileNative(mdContent, `${safeFilename}.md`, "md")
}

export function exportChatToJson(title: string, messages: ChatMessage[]) {
  if (!messages || messages.length === 0) {
    toast.add({
      title: "Экспорт недоступен",
      description: "Нет сообщений для экспорта",
      type: "warning",
    })
    return
  }

  const data = {
    title,
    exportedAt: new Date().toISOString(),
    messages,
  }

  const jsonContent = JSON.stringify(data, null, 2)
  const safeFilename = title.toLowerCase().replace(/[^a-z0-9а-яё]/gi, "_") || "chat_export"
  saveFileNative(jsonContent, `${safeFilename}.json`, "json")
}

export async function exportDatabaseFile(title: string) {
  try {
    // Принудительно инициализируем/проверяем базу данных на диске перед чтением
    await getDatabase()

    const safeFilename = title.toLowerCase().replace(/[^a-z0-9а-яё]/gi, "_") || "lazyseal"

    const filePath = await save({
      defaultPath: `${safeFilename}_backup.db`,
      filters: [{
        name: "SQLite Database",
        extensions: ["db", "sqlite"]
      }]
    })

    if (filePath) {
      const localDataDir = await appLocalDataDir()
      const dbPath = await join(localDataDir, "lazyseal.db")

      const binaryData = await readFile(dbPath)
      await writeFile(filePath, binaryData)

      toast.add({
        title: "Резервная копия создана",
        description: `База данных сохранена: ${filePath}`,
        type: "success",
      })
    }
  } catch (error: any) {
    console.error("Ошибка при экспорте базы данных:", error)
    const errMessage = error?.message || String(error)
    toast.add({
      title: "Ошибка экспорта базы данных",
      description: errMessage,
      type: "error",
    })
  }
}