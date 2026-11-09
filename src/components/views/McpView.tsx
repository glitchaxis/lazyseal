import { useState, useEffect } from "react"
import {
  PlusIcon,
  CheckCircle2Icon,
  XCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  DatabaseIcon,
  FolderIcon,
  GlobeIcon,
  CodeIcon,
  InfoIcon,
  Trash2Icon,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"

type McpServer = {
  id: string
  name: string
  description: string
  status: "connected" | "disconnected" | "error"
  enabled: boolean
  command: string
  toolsCount: number
}

const INITIAL_SERVERS: McpServer[] = [
  {
    id: "filesystem",
    name: "Local Filesystem",
    description: "Предоставляет модели доступ к указанным директориям файловой системы.",
    status: "connected",
    enabled: true,
    command: "npx -y @modelcontextprotocol/server-filesystem C:\\Users\\User\\Documents",
    toolsCount: 4,
  },
  {
    id: "brave-search",
    name: "Brave Web Search",
    description: "Позволяет модели выполнять веб-поиск и получать свежую информацию из сети.",
    status: "disconnected",
    enabled: false,
    command: "npx -y @modelcontextprotocol/server-brave-search",
    toolsCount: 2,
  },
  {
    id: "sqlite",
    name: "SQLite Database Manager",
    description: "Чтение схематических данных и выполнение SQL-запросов к локальной БД.",
    status: "connected",
    enabled: true,
    command: "uvx mcp-server-sqlite --db-path ./lazyseal.db",
    toolsCount: 6,
  },
  {
    id: "github",
    name: "GitHub API Integration",
    description: "Работа с репозиториями, коммитами, issue и pull request-ами напрямую из чата.",
    status: "disconnected",
    enabled: false,
    command: "npx -y @modelcontextprotocol/server-github",
    toolsCount: 9,
  },
]

export function McpView() {
  const [servers, setServers] = useState<McpServer[]>(() => {
    const saved = localStorage.getItem("lazyseal_mcp_servers")
    if (saved) {
      try { 
        return JSON.parse(saved) 
      } catch (e) {
        console.error("Ошибка парсинга серверов MCP:", e)
      }
    }
    return INITIAL_SERVERS
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newCommand, setNewCommand] = useState("")

  useEffect(() => {
    localStorage.setItem("lazyseal_mcp_servers", JSON.stringify(servers))
  }, [servers])

  const toggleServer = (id: string) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextEnabled = !s.enabled
          
          toast.add({
            title: nextEnabled ? "MCP Сервер активирован" : "MCP Сервер отключен",
            description: `Сервер "${s.name}" успешно ${nextEnabled ? "запущен" : "остановлен"}.`,
            type: nextEnabled ? "success" : "warning",
          })

          return {
            ...s,
            enabled: nextEnabled,
            status: nextEnabled ? "connected" : "disconnected",
          }
        }
        return s
      })
    )
  }

  const handleDeleteServer = (id: string, name: string) => {
    setServers((prev) => prev.filter((s) => s.id !== id))
    toast.add({
      title: "Сервер удален",
      description: `MCP сервер "${name}" удален из конфигурации.`,
      type: "error",
    })
  }

  const handleAddServer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newCommand.trim()) return

    const newServer: McpServer = {
      id: "custom-" + Date.now(),
      name: newName.trim(),
      description: newDesc.trim() || "Пользовательский MCP сервер",
      status: "connected",
      enabled: true,
      command: newCommand.trim(),
      toolsCount: Math.floor(Math.random() * 5) + 1,
    }

    setServers((prev) => [newServer, ...prev])
    setIsAddModalOpen(false)
    setNewName("")
    setNewDesc("")
    setNewCommand("")

    toast.add({
      title: "MCP Сервер добавлен",
      description: `Сервер "${newServer.name}" успешно подключен.`,
      type: "success",
    })
  }

  const filteredServers = servers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto w-full pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span>MCP Серверы</span>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
              Beta / Protocol v1.0
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Подключение внешних инструментов и контекстных серверов по протоколу Model Context Protocol.
          </p>
        </div>

        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="gap-2 shrink-0 border-border/40 active:scale-95 transition-transform"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Добавить MCP сервер</span>
        </Button>
      </div>

      <Separator className="bg-border/40" />

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск серверов по имени или описанию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-card/50 border-border/40 focus-visible:ring-primary/40"
        />
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
        <InfoIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          Подключенные MCP-серверы расширяют возможности языковой модели: позволяют читать файлы на диске, выполнять SQL-запросы или искать информацию в реальном времени.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredServers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
            Серверы не найдены. Добавьте новый сервер кнопкой выше.
          </div>
        ) : (
          filteredServers.map((server) => {
            const Icon = server.id.includes("file") ? FolderIcon : server.id.includes("sql") ? DatabaseIcon : server.id.includes("search") ? GlobeIcon : CodeIcon
            
            return (
              <Card key={server.id} className="border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-200 hover:border-border/80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-muted/60 border border-border/40 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {server.name}
                          {server.enabled ? (
                            <span className="flex items-center gap-1 text-xs font-normal text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2Icon className="h-3 w-3" />
                              Активен ({server.toolsCount} tools)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">
                              <XCircleIcon className="h-3 w-3" />
                              Отключен
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {server.description}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={server.enabled}
                        onCheckedChange={() => toggleServer(server.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteServer(server.id, server.name)}
                        title="Удалить сервер"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] bg-muted/40 border border-border/40 px-3 py-1.5 rounded-lg text-muted-foreground">
                    <span className="truncate">{server.command}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 hover:bg-muted"
                      title="Перезапустить процесс"
                      onClick={() => {
                        toast.add({
                          title: "Перезапуск сервера",
                          description: `Процесс "${server.name}" перезапущен.`,
                          type: "success",
                        })
                      }}
                    >
                      <RefreshCwIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md border-border/40 bg-card/95 backdrop-blur-md">
          <form onSubmit={handleAddServer}>
            <DialogHeader>
              <DialogTitle>Добавить MCP сервер</DialogTitle>
              <DialogDescription>
                Укажите параметры запуска внешнего контекстного сервера (stdio / SSE).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="mcp-name">Название сервера</Label>
                <Input
                  id="mcp-name"
                  placeholder="Например: Custom API Server"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mcp-desc">Описание</Label>
                <Input
                  id="mcp-desc"
                  placeholder="Что делает этот сервер..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mcp-cmd">Команда запуска (Command / Stdio)</Label>
                <Input
                  id="mcp-cmd"
                  placeholder="npx -y @modelcontextprotocol/server-..."
                  value={newCommand}
                  onChange={(e) => setNewCommand(e.target.value)}
                  required
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="border-border/40"
              >
                Отмена
              </Button>
              <Button type="submit">Подключить</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}