import { useState } from "react"
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
import { useSettings } from "@/hooks/useSettings"

type SettingsViewProps = {
  activeModelPath: string | null
  startModelServer: (path: string, settings?: ServerSettings) => void
}

export function SettingsView({ activeModelPath, startModelServer }: SettingsViewProps) {
  const {
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
  } = useSettings()

  const [saved, setSaved] = useState(false)

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
    saveSettings()

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