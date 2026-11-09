import { useRef, useState } from "react"
import { Streamdown } from "streamdown"
import {
  ArrowUpIcon,
  ChevronDownIcon,
  CopyIcon,
  CheckIcon,
  RefreshCcwIcon,
  BrainCircuitIcon,
  Loader2Icon,
  HardDriveIcon,
  DownloadIcon,
  FileTextIcon,
  FileJsonIcon,
  FolderCodeIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  DatabaseIcon, // <--- Иконка для базы данных
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Message, MessageContent, MessageFooter } from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Reasoning } from "@/components/ui/reasoning"
import { ChatMessage } from "@/types"
import { LocalModel } from "@/hooks/useModels"
import { exportChatToMarkdown, exportChatToJson, exportDatabaseFile } from "@/lib/export" // <--- Импортируем бэкап БД

type ChatViewProps = {
  messages: ChatMessage[]
  isLoading: boolean
  onSendMessage: (text: string) => void
  model: string
  setModel: (model: string) => void
  localModels: LocalModel[]
  onSelectModel: (path: string) => void
  useReasoning: boolean
  setUseReasoning: (val: boolean) => void
  isFilesPanelOpen?: boolean
  setIsFilesPanelOpen?: (val: React.SetStateAction<boolean>) => void
  chatTitle?: string
}

export function ChatView({
  messages,
  isLoading,
  onSendMessage,
  model,
  setModel,
  localModels,
  onSelectModel,
  useReasoning,
  setUseReasoning,
  isFilesPanelOpen,
  setIsFilesPanelOpen,
  chatTitle = "Новый диалог",
}: ChatViewProps) {
  const [text, setText] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const canSend = text.trim().length > 0 && !isLoading

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSend) return
    onSendMessage(text)
    setText("")
  }

  return (
    <div className="flex flex-1 gap-4 min-h-0 max-w-7xl mx-auto w-full">
      <div className="flex flex-1 flex-col min-h-0 border border-border/40 rounded-xl bg-card shadow-sm overflow-hidden">
        {/* Тулбар окна чата */}
        <div className="h-12 shrink-0 flex items-center justify-between border-b border-border/40 px-4 bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-semibold text-sm truncate max-w-[200px]">
              {chatTitle}
            </span>
            
            {/* Статусный бейдж активной модели */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/40 border border-border/40 text-xs font-mono text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="truncate max-w-[180px]">
                {model ? model : "Модель не выбрана"}
              </span>
              <span className="text-[10px] text-muted-foreground/60 border-l border-border/40 pl-2">
                127.0.0.1:8080
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-7 text-xs font-mono border border-border/40 hover:bg-muted/50 transition-all duration-200 active:scale-95"
                    disabled={messages.length === 0}
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    <span>Экспорт</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56 animate-in fade-in-80 zoom-in-95">
                <DropdownMenuItem
                  onClick={() => exportChatToMarkdown(chatTitle, messages)}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <FileTextIcon className="h-4 w-4" />
                  <span>В формате Markdown (.md)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportChatToJson(chatTitle, messages)}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <FileJsonIcon className="h-4 w-4" />
                  <span>В формате JSON (.json)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportDatabaseFile(chatTitle)}
                  className="gap-2 cursor-pointer text-xs text-primary font-medium"
                >
                  <DatabaseIcon className="h-4 w-4" />
                  <span>База данных SQLite (.db)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {setIsFilesPanelOpen && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-7 text-xs font-mono border border-border/40 hover:bg-muted/50 transition-all duration-200 active:scale-95"
                onClick={() => setIsFilesPanelOpen((v) => !v)}
              >
                <FolderCodeIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Файлы</span>
                {isFilesPanelOpen ? (
                  <PanelRightCloseIcon className="h-3.5 w-3.5" />
                ) : (
                  <PanelRightOpenIcon className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        <MessageScrollerProvider autoScroll>
          <MessageScroller className="flex-1 p-4">
            <MessageScrollerViewport className="space-y-4">
              {messages.map((message) => (
                <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor>
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {message.role === "user" ? (
                      <Message align="end">
                        <MessageContent>
                          <Bubble align="end" variant="muted" className="shadow-sm">
                            <BubbleContent>{message.content}</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    ) : (
                      <Message align="start">
                        <MessageContent className="gap-3">
                          {message.reasoning && (
                            <Reasoning text={message.reasoning} running={message.isStreaming && !message.content} />
                          )}

                          <div className="text-sm leading-relaxed max-w-none">
                            <Streamdown>{message.content}</Streamdown>
                          </div>

                          <MessageFooter>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Скопировать"
                              className="transition-transform active:scale-90"
                              onClick={() => handleCopy(message.id, message.content)}
                            >
                              {copiedId === message.id ? (
                                <CheckIcon className="h-4 w-4 text-green-500 animate-in zoom-in-50" />
                              ) : (
                                <CopyIcon className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              aria-label="Повторить"
                              className="transition-transform active:scale-90"
                            >
                              <RefreshCcwIcon className="h-4 w-4" />
                            </Button>
                          </MessageFooter>
                        </MessageContent>
                      </Message>
                    )}
                  </div>
                </MessageScrollerItem>
              ))}

              {isLoading && (
                <MessageScrollerItem messageId="loading-indicator">
                  <Message align="start">
                    <MessageContent className="gap-2">
                      {useReasoning && <Reasoning running={true} text="Анализируем контекст..." />}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted/40 px-3 py-2 rounded-lg border border-border/40 animate-pulse">
                        <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
                        <span>Генерация ответа моделью...</span>
                      </div>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )}
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        {/* Поле ввода сообщения */}
        <form ref={formRef} onSubmit={onSubmit} className="p-4 border-t border-border/40 bg-background/50">
          <InputGroup>
            <InputGroupTextarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onSubmit(e)
                }
              }}
              placeholder={isLoading ? "Модель думает..." : "Введите сообщение..."}
              disabled={isLoading}
            />
            <InputGroupAddon align="block-end">
              <DropdownMenu>
                <DropdownMenuTrigger render={<InputGroupButton size="sm" />}>
                  <span className="truncate max-w-[150px]">{model || "Выберите модель"}</span>
                  <ChevronDownIcon className="ml-1 h-3 w-3 shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-w-xs">
                  <DropdownMenuRadioGroup
                    value={model}
                    onValueChange={(val) => {
                      setModel(val)
                      const targetModel = localModels.find((m) => m.name === val)
                      if (targetModel) {
                        onSelectModel(targetModel.path)
                      }
                    }}
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Локальные GGUF-модели</DropdownMenuLabel>
                      {localModels.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                          <HardDriveIcon className="h-3.5 w-3.5" />
                          <span>Файлы .gguf не найдены</span>
                        </div>
                      ) : (
                        localModels.map((m) => (
                          <DropdownMenuRadioItem key={m.path} value={m.name} closeOnClick>
                            <span className="truncate">{m.name}</span>
                          </DropdownMenuRadioItem>
                        ))
                      )}
                    </DropdownMenuGroup>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant={useReasoning ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2 gap-1.5 text-xs"
                onClick={() => setUseReasoning(!useReasoning)}
                title="Включить/выключить рассуждения"
              >
                <BrainCircuitIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reasoning</span>
              </Button>

              <InputGroupButton
                type="submit"
                variant="default"
                className="ml-auto"
                disabled={!canSend}
                aria-label="Отправить"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
    </div>
  )
}