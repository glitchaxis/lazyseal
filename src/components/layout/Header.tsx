import { FolderCodeIcon, PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type HeaderProps = {
  currentTab: "chat" | "models" | "settings"
  isFilesPanelOpen: boolean
  setIsFilesPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function Header({ currentTab, isFilesPanelOpen, setIsFilesPanelOpen }: HeaderProps) {
  return (
    <header className="h-14 shrink-0 flex items-center justify-between border-b border-border/40 px-6 z-20 bg-background">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg tracking-tight">lazyseal</span>
        <Separator orientation="vertical" className="h-4 bg-border/40" />
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>llama.cpp (localhost:8080)</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {currentTab === "chat" && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 h-8 text-xs font-mono border border-border/40 hover:bg-muted/50"
            onClick={() => setIsFilesPanelOpen((v) => !v)}
          >
            <FolderCodeIcon className="h-4 w-4" />
            <span>Файлы проекта</span>
            {isFilesPanelOpen ? (
              <PanelRightCloseIcon className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpenIcon className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
    </header>
  )
}