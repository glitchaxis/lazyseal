import { useState, useEffect } from "react"

export function useSettings() {
  const [theme, setTheme] = useState<"dark" | "light" | "system">(() => {
    return (localStorage.getItem("lazyseal_theme") as "dark" | "light" | "system") || "system"
  })
  
  const [port, setPort] = useState(() => localStorage.getItem("lazyseal_port") || "8080")
  const [threads, setThreads] = useState(() => localStorage.getItem("lazyseal_threads") || "8")
  const [contextSize, setContextSize] = useState(() => localStorage.getItem("lazyseal_contextSize") || "4096")
  const [gpuAcceleration, setGpuAcceleration] = useState(
    () => localStorage.getItem("lazyseal_gpuAcceleration") !== "false"
  )

  const [temperature, setTemperature] = useState(() => localStorage.getItem("lazyseal_temperature") || "0.7")
  const [maxTokens, setMaxTokens] = useState(() => localStorage.getItem("lazyseal_maxTokens") || "2048")
  const [topP, setTopP] = useState(() => localStorage.getItem("lazyseal_topP") || "0.9")
  const [topK, setTopK] = useState(() => localStorage.getItem("lazyseal_topK") || "40")
  const [repeatPenalty, setRepeatPenalty] = useState(() => localStorage.getItem("lazyseal_repeatPenalty") || "1.1")
  const [systemPrompt, setSystemPrompt] = useState(
    () => localStorage.getItem("lazyseal_systemPrompt") || "Ты — полезный локальный ИИ-ассистент."
  )

  // Мгновенное применение темы при изменении
  useEffect(() => {
    const root = document.documentElement
    localStorage.setItem("lazyseal_theme", theme)
    if (theme === "dark") {
      root.classList.add("dark")
    } else if (theme === "light") {
      root.classList.remove("dark")
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (systemDark) root.classList.add("dark")
      else root.classList.remove("dark")
    }
  }, [theme])

  // Сохранение всех параметров в localStorage
  const saveSettings = () => {
    localStorage.setItem("lazyseal_port", port)
    localStorage.setItem("lazyseal_threads", threads)
    localStorage.setItem("lazyseal_contextSize", contextSize)
    localStorage.setItem("lazyseal_gpuAcceleration", String(gpuAcceleration))
    localStorage.setItem("lazyseal_temperature", temperature)
    localStorage.setItem("lazyseal_maxTokens", maxTokens)
    localStorage.setItem("lazyseal_topP", topP)
    localStorage.setItem("lazyseal_topK", topK)
    localStorage.setItem("lazyseal_repeatPenalty", repeatPenalty)
    localStorage.setItem("lazyseal_systemPrompt", systemPrompt)
  }

  return {
    theme,
    setTheme,
    port,
    setPort,
    threads,
    setThreads,
    contextSize,
    setContextSize,
    gpuAcceleration,
    setGpuAcceleration,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    topP,
    setTopP,
    topK,
    setTopK,
    repeatPenalty,
    setRepeatPenalty,
    systemPrompt,
    setSystemPrompt,
    saveSettings,
  }
}