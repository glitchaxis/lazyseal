import { useState, useEffect } from "react"
import type { HuggingFaceModel } from "@/types"
import { fetchHfModels } from "@/lib/api"

export type DownloadStatus = {
  id: string
  modelId: string
  fileName: string
  sizeBytes: number
  downloadedBytes: number
  speedBytesPerSec: number
  status: "idle" | "downloading" | "paused" | "completed" | "error"
  progress: number
  isDownloading: boolean
}

export type LocalModel = {
  name: string
  sizeBytes: number
  path: string
}

export type ServerSettings = {
  port: string
  threads: string
  contextSize: string
  gpuAcceleration: boolean
}

export function useModels() {
  const [hfSearchQuery, setHfSearchQuery] = useState("gguf")
  const [hfModels, setHfModels] = useState<HuggingFaceModel[]>([])
  const [isHfLoading, setIsHfLoading] = useState(false)
  const [downloads, setDownloads] = useState<Record<string, DownloadStatus>>({})
  const [localModels, setLocalModels] = useState<LocalModel[]>([])
  const [activeModelPath, setActiveModelPath] = useState<string | null>(null)

  const searchHfModels = async () => {
    setIsHfLoading(true)
    try {
      const models = await fetchHfModels(hfSearchQuery)
      setHfModels(models)
    } catch (e) {
      console.error(e)
    } finally {
      setIsHfLoading(false)
    }
  }

  const fetchLocalModels = async () => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return
    try {
      const { invoke } = await import("@tauri-apps/api/core")
      const files = await invoke<Array<{ name: string; size_bytes: number; path: string }>>("list_local_models")
      setLocalModels(
        files.map((f) => ({
          name: f.name,
          sizeBytes: f.size_bytes,
          path: f.path,
        }))
      )
    } catch (e) {
      console.error("Ошибка при получении локальных моделей:", e)
    }
  }

  const startModelServer = async (modelPath: string, customSettings?: ServerSettings) => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return
    try {
      const savedSettings = customSettings || {
        port: localStorage.getItem("lazyseal_port") || "8080",
        threads: localStorage.getItem("lazyseal_threads") || "8",
        contextSize: localStorage.getItem("lazyseal_contextSize") || "4096",
        gpuAcceleration: localStorage.getItem("lazyseal_gpuAcceleration") !== "false",
      }

      const { invoke } = await import("@tauri-apps/api/core")
      const result = await invoke<string>("start_llama_server", {
        modelPath,
        port: savedSettings.port,
        threads: savedSettings.threads,
        contextSize: savedSettings.contextSize,
        gpuAcceleration: savedSettings.gpuAcceleration,
      })
      console.log(result)
      setActiveModelPath(modelPath)
    } catch (e) {
      console.error("Ошибка запуска сервера модели:", e)
      alert("Не удалось запустить llama-server. Проверьте консоль.")
    }
  }

  useEffect(() => {
    fetchLocalModels()

    let unlisten: (() => void) | undefined
    const setupListener = async () => {
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        const { listen } = await import("@tauri-apps/api/event")
        unlisten = await listen<{
          model_id: string
          file_name: string
          downloaded: number
          total: number
          percentage: number
        }>("download-progress", (event) => {
          const { model_id, file_name, downloaded, total, percentage } = event.payload
          const id = model_id

          setDownloads((prev) => {
            const isCompleted = percentage >= 100
            if (isCompleted) {
              fetchLocalModels()
            }
            return {
              ...prev,
              [id]: {
                id,
                modelId: model_id,
                fileName: file_name || "model.gguf",
                sizeBytes: total || 1024,
                downloadedBytes: downloaded,
                speedBytesPerSec: 0,
                status: isCompleted ? "completed" : "downloading",
                progress: percentage,
                isDownloading: !isCompleted,
              },
            }
          })
        })
      }
    }

    setupListener()
    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  const downloadModel = async (modelId: string, fileName?: string, sizeBytes?: number) => {
    const id = modelId
    const fName = fileName || "model.gguf"

    setDownloads((prev) => ({
      ...prev,
      [id]: {
        id,
        modelId,
        fileName: fName,
        sizeBytes: sizeBytes || 4 * 1024 * 1024 * 1024,
        downloadedBytes: 0,
        speedBytesPerSec: 0,
        status: "downloading",
        progress: 0,
        isDownloading: true,
      },
    }))

    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return

    try {
      const { invoke } = await import("@tauri-apps/api/core")
      const url = `https://huggingface.co/${modelId}/resolve/main/${fName}`

      await invoke("download_model", {
        model_id: modelId,
        file_name: fName,
        url,
      })
      fetchLocalModels()
    } catch (error) {
      console.error("Ошибка при скачивании модели:", error)
      setDownloads((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: "error", isDownloading: false },
      }))
    }
  }

  return {
    hfSearchQuery,
    setHfSearchQuery,
    hfModels,
    isHfLoading,
    downloads,
    localModels,
    activeModelPath,
    searchHfModels,
    downloadModel,
    fetchLocalModels,
    startModelServer,
  }
}