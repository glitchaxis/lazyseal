import { useState } from "react"
import {
  SearchIcon,
  DownloadIcon,
  HardDriveIcon,
  CheckCircle2Icon,
  FileCode2Icon,
  Trash2Icon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HuggingFaceModel } from "@/types"
import { DownloadStatus, LocalModel } from "@/hooks/useModels"

type ModelsViewProps = {
  searchQuery: string
  setSearchQuery: (query: string) => void
  models: HuggingFaceModel[]
  isLoading: boolean
  downloads: DownloadStatus[]
  localModels: LocalModel[]
  onSearch: () => void
  onDownload: (modelId: string, fileName?: string, sizeBytes?: number) => void
  startModelServer: (path: string) => void
}

export function ModelsView({
  searchQuery,
  setSearchQuery,
  models,
  isLoading,
  downloads,
  localModels,
  onSearch,
  onDownload,
  startModelServer,
}: ModelsViewProps) {
  const formatSize = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  const formatSpeed = (bytesPerSec: number) => (bytesPerSec / (1024 * 1024)).toFixed(1) + " MB/s"

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden space-y-4 max-w-6xl mx-auto w-full">
      <Tabs defaultValue="search" className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between border-b pb-3">
          <TabsList>
            <TabsTrigger value="search" className="gap-2">
              <SearchIcon className="h-4 w-4" />
              <span>Поиск моделей (HF)</span>
            </TabsTrigger>
            <TabsTrigger value="downloads" className="gap-2 relative">
              <DownloadIcon className="h-4 w-4" />
              <span>Загрузки</span>
              {downloads.filter((d) => d.status === "downloading").length > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {downloads.filter((d) => d.status === "downloading").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="local" className="gap-2">
              <HardDriveIcon className="h-4 w-4" />
              <span>Локальные модели</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Вкладка поиска */}
        <TabsContent value="search" className="flex-1 flex flex-col min-h-0 space-y-4 pt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder="Поиск GGUF моделей на HuggingFace..."
                className="pl-9"
              />
            </div>
            <Button onClick={onSearch} disabled={isLoading}>
              {isLoading ? "Поиск..." : "Найти"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1 pb-4">
            {models.map((m) => {
              const activeDownload = downloads.find((d) => d.id === m.modelId)
              const baseFileName = (m.modelId.split("/")[1] || "model") + ".Q4_K_M.gguf"

              return (
                <Card
                  key={m.id}
                  className="p-4 flex flex-col justify-between gap-4 bg-card border border-border/40 hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold truncate text-foreground">{m.modelId}</CardTitle>
                      <Badge variant="outline" className="text-xs shrink-0">
                        GGUF
                      </Badge>
                    </div>
                    <CardDescription className="text-xs flex gap-3">
                      <span>Загрузок: {m.downloads.toLocaleString()}</span>
                      <span>Лайков: {m.likes.toLocaleString()}</span>
                    </CardDescription>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <span className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                      {baseFileName}
                    </span>

                    <Button
                      size="sm"
                      variant="default"
                      className="gap-2 shrink-0"
                      disabled={!!activeDownload && activeDownload.isDownloading}
                      onClick={() => onDownload(m.modelId, baseFileName, 4.3 * 1024 * 1024 * 1024)}
                    >
                      {activeDownload && activeDownload.status === "completed" ? (
                        <span className="text-xs">Загружено</span>
                      ) : activeDownload && activeDownload.isDownloading ? (
                        <span className="text-xs">В процессе...</span>
                      ) : (
                        <>
                          <DownloadIcon className="h-4 w-4" />
                          <span>Скачать</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Вкладка загрузок */}
        <TabsContent value="downloads" className="flex-1 flex flex-col min-h-0 pt-4">
          <div className="border rounded-lg overflow-hidden flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Модель / Файл</TableHead>
                  <TableHead>Прогресс</TableHead>
                  <TableHead>Скорость</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {downloads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                      Нет активных или завершенных загрузок
                    </TableCell>
                  </TableRow>
                ) : (
                  downloads.map((d) => {
                    const percent = Math.round(d.progress || 0)
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="max-w-xs truncate">
                          <div className="font-medium text-sm truncate">{d.modelId}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate">{d.fileName}</div>
                        </TableCell>
                        <TableCell className="w-64">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span>{percent}%</span>
                              <span>
                                {formatSize(d.downloadedBytes)} / {formatSize(d.sizeBytes)}
                              </span>
                            </div>
                            <Progress value={percent} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {d.status === "downloading" ? formatSpeed(d.speedBytesPerSec) : d.status.toUpperCase()}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Вкладка локальных моделей */}
        <TabsContent value="local" className="flex-1 flex flex-col min-h-0 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localModels.length === 0 ? (
              <div className="col-span-full border border-dashed rounded-lg p-12 text-center text-muted-foreground space-y-2">
                <FileCode2Icon className="h-8 w-8 mx-auto opacity-50" />
                <div>Локальные GGUF-модели не найдены в папке приложения</div>
              </div>
            ) : (
              localModels.map((m: LocalModel) => (
                <Card key={m.name} className="p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between pb-1">
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500 gap-1">
                        <CheckCircle2Icon className="h-3 w-3" /> Доступно
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatSize(m.sizeBytes)}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-semibold truncate pt-1">{m.name}</CardTitle>
                    <CardDescription className="text-xs font-mono truncate">{m.path}</CardDescription>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => startModelServer(m.path)}
                    >
                      Запустить модель
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}