import { MessageSquare, Download, Settings, Plus, Trash2, Plug } from "lucide-react"

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export type ChatSession = {
  id: string
  title: string
}

type SidebarProps = {
  chats: ChatSession[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onDeleteChat: (id: string) => void
  currentTab: "chat" | "models" | "settings" | "mcp"
  onTabChange: (tab: "chat" | "models" | "settings" | "mcp") => void
}

export function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  currentTab,
  onTabChange,
}: SidebarProps) {
  return (
   <ShadcnSidebar 
  variant="sidebar" 
  collapsible="icon" 
  className="border-r border-border/40 bg-sidebar/80 backdrop-blur-md transition-all duration-300"
>
  <SidebarHeader className="border-b border-border/40 h-14 px-4 flex items-center justify-center bg-sidebar/40 backdrop-blur-sm">
    <div className="flex items-center font-bold text-lg tracking-tight overflow-hidden w-full">
      <span className="truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">lazyseal</span>
    </div>
  </SidebarHeader>

  <SidebarContent className="p-2">
    <SidebarGroup>
      <SidebarGroupLabel>Меню</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentTab === "chat"}
              onClick={() => onTabChange("chat")}
              className="transition-all duration-200 active:scale-98"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Чат</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentTab === "models"}
              onClick={() => onTabChange("models")}
              className="transition-all duration-200 active:scale-98"
            >
              <Download className="h-4 w-4" />
              <span>Поиск и модели</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentTab === "settings"}
              onClick={() => onTabChange("settings")}
              className="transition-all duration-200 active:scale-98"
            >
              <Settings className="h-4 w-4" />
              <span>Настройки</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentTab === "mcp"}
              onClick={() => onTabChange("mcp")}
              className="transition-all duration-200 active:scale-98"
            >
              <Plug className="h-4 w-4" />
              <span>MCP Серверы</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>

    <SidebarSeparator className="bg-border/40 my-2" />

    {currentTab === "chat" && (
      <SidebarGroup className="animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-2 py-1">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">История чатов</SidebarGroupLabel>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 transition-transform hover:rotate-90 duration-200" 
            onClick={onNewChat}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <SidebarGroupContent>
          <SidebarMenu>
            {chats.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton
                  isActive={chat.id === activeChatId}
                  onClick={() => onSelectChat(chat.id)}
                  className="group/item flex justify-between pr-1 transition-all duration-150"
                >
                  <span className="truncate">{chat.title}</span>
                  <button
                    type="button"
                    className="opacity-0 group-hover/item:opacity-100 hover:text-destructive transition-all duration-150 p-1 hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteChat(chat.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )}
  </SidebarContent>

  <SidebarFooter className="border-t border-border/40 p-3 bg-sidebar/40 backdrop-blur-sm">
    <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="group-data-[collapsible=icon]:hidden truncate font-mono">llama.cpp active</span>
    </div>
  </SidebarFooter>
</ShadcnSidebar>
  )
}