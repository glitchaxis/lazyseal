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
  setIsFilesPanelOpen?: (val: boolean) => void
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
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="flex-1 p-4">
            <MessageScrollerViewport className="space-y-4">
              {messages.map((message) => (
                <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor>
                  {message.role === "user" ? (
                    <Message align="end">
                      <MessageContent>
                        <Bubble align="end" variant="muted">
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
                            onClick={() => handleCopy(message.id, message.content)}
                          >
                            {copiedId === message.id ? (
                              <CheckIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <CopyIcon className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label="Повторить">
                            <RefreshCcwIcon className="h-4 w-4" />
                          </Button>
                        </MessageFooter>
                      </MessageContent>
                    </Message>
                  )}
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