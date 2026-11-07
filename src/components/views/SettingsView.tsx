import { useState, useEffect } from "react"
import {
  SaveIcon,
  FolderOpenIcon,
  ServerIcon,
  MessageSquareCodeIcon,
  SunMoonIcon,
  MonitorIcon,
  SunIcon,
  MoonIcon,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ServerSettings } from "@/hooks/useModels"

type SettingsViewProps = {
  activeModelPath: string | null
  startModelServer: (path: string, settings?: ServerSettings) => void
}

export function SettingsView({ activeModelPath, startModelServer }: SettingsViewProps) {
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark")
  const [port, setPort] = useState(() => localStorage.getItem("lazyseal_port") || "8080")
  const [threads, setThreads] = useState(() => localStorage.getItem("lazyseal_threads") || "8")
  const [contextSize, setContextSize] = useState(() => localStorage.getItem("lazyseal_contextSize") || "4096")
  const [gpuAcceleration, setGpuAcceleration] = useState(
    () => localStorage.getItem("lazyseal_gpuAcceleration") !== "false"
  )

  const [temperature, setTemperature] = useState("0.7")
  const [maxTokens, setMaxTokens] = useState("2048")
  const [topP, setTopP] = useState("0.9")
  const [topK, setTopK] = useState("40")
  const [repeatPenalty, setRepeatPenalty] = useState("1.1")
  const [systemPrompt, setSystemPrompt] = useState("Ты — полезный локальный ИИ-ассистент.")

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const root = document.documentElement
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

  const handleOpenFolder = async () => {
    try {
      if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        const { invoke } = await import("@tauri-apps/api/core")
        await invoke("open_models_folder")
      }
    } catch (e) {
      console.error("Ошибка при открытии папки:", e)
    }
  }

  const handleSave = () => {
    localStorage.setItem("lazyseal_port", port)
    localStorage.setItem("lazyseal_threads", threads)
    localStorage.setItem("lazyseal_contextSize", contextSize)
    localStorage.setItem("lazyseal_gpuAcceleration", String(gpuAcceleration))

    if (activeModelPath) {
      startModelServer(activeModelPath, {
        port,
        threads,
        contextSize,
        gpuAcceleration,
      })
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto w-full pb-12">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Настройки приложения</h2>
        <p className="text-sm text-muted-foreground">
          Управление внешним видом, параметрами локального инференса и лимитами токенов.
        </p>
      </div>

      <Separator className="bg-border/40" />

      <Card className="border-border/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SunMoonIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Внешний вид и тема</CardTitle>
          </div>
          <CardDescription>Выберите удобное цветовое оформление приложения.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            className="flex-1 gap-2 border-border/40"
            onClick={() => setTheme("dark")}
          >
            <MoonIcon className="h-4 w-4" />
            <span>Темная</span>
          </Button>
          <Button
            variant={theme === "light" ? "default" : "outline"}
            className="flex-1 gap-2 border-border/40"
            onClick={() => setTheme("light")}
          >
            <SunIcon className="h-4 w-4" />
            <span>Светлая</span>
          </Button>
          <Button
            variant={theme === "system" ? "default" : "outline"}
            className="flex-1 gap-2 border-border/40"
            onClick={() => setTheme("system")}
          >
            <MonitorIcon className="h-4 w-4" />
            <span>Системная</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquareCodeIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Параметры генерации и чата</CardTitle>
          </div>
          <CardDescription>
            Тонкая настройка креативности, ограничений длины ответов и системных инструкций.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="temp">Температура (Temperature)</Label>
                <span className="text-xs font-mono text-muted-foreground">{temperature}</span>
              </div>
              <Input
                id="temp"
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tokens">Максимум токенов (Max Tokens)</Label>
              <Input
                id="tokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                placeholder="Например: 2048"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topP">Top P</Label>
              <Input id="topP" value={topP} onChange={(e) => setTopP(e.target.value)} placeholder="0.9" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topK">Top K</Label>
              <Input id="topK" value={topK} onChange={(e) => setTopK(e.target.value)} placeholder="40" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="penalty">Штраф за повторения (Repeat Penalty)</Label>
              <Input
                id="penalty"
                value={repeatPenalty}
                onChange={(e) => setRepeatPenalty(e.target.value)}
                placeholder="1.1"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="sysprompt">Системный промпт (System Prompt)</Label>
            <Input
              id="sysprompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Введите базовую инструкцию для модели..."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Локальный сервер (llama.cpp)</CardTitle>
          </div>
          <CardDescription>Параметры подключения и ресурсов процесса.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="port">Порт сервера</Label>
              <Input id="port" value={port} onChange={(e) => setPort(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threads">Потоки CPU</Label>
              <Input id="threads" value={threads} onChange={(e) => setThreads(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context">Размер контекста</Label>
              <Input id="context" value={contextSize} onChange={(e) => setContextSize(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label className="text-base">GPU Ускорение</Label>
              <div className="text-xs text-muted-foreground">Разгрузка вычислений на видеокарту</div>
            </div>
            <Switch checked={gpuAcceleration} onCheckedChange={setGpuAcceleration} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderOpenIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Хранилище моделей</CardTitle>
          </div>
          <CardDescription>
            Директория в файловой системе, куда сохраняются скачанные GGUF-файлы.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="font-mono text-xs bg-muted/50 border border-border/40 p-3 rounded-md flex-1 truncate">
            AppData/Roaming/lazyseal/models (или ~/.local/share/lazyseal/models)
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0 border-border/40" onClick={handleOpenFolder}>
            <FolderOpenIcon className="h-4 w-4" />
            <span>Открыть папку</span>
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-6">
        <Button onClick={handleSave} className="gap-2">
          <SaveIcon className="h-4 w-4" />
          <span>{saved ? "Сохранено и применилось!" : "Сохранить настройки"}</span>
        </Button>
      </div>
    </div>
  )
}