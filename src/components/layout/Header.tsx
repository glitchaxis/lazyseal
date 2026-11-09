import { Separator } from "@/components/ui/separator"

type HeaderProps = {
  currentTab?: "chat" | "models" | "settings" | "mcp"
}

export function Header({}: HeaderProps) {
  return (
    <header className="h-14 shrink-0 flex items-center justify-between border-b border-border/40 px-6 z-20 bg-background">
      <div className="flex items-center gap-6">
        <Separator orientation="vertical" className="h-4 bg-border/40" />
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>llama.cpp (localhost:8080)</span>
        </div>
      </div>
    </header>
  )
}