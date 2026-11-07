import { MessageSquare, Download, Settings, Plus, Trash2 } from "lucide-react"

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
  currentTab: "chat" | "models" | "settings"
  onTabChange: (tab: "chat" | "models" | "settings") => void
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
    <ShadcnSidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b h-14 px-4 flex items-center justify-center">
        <div className="flex items-center font-bold text-lg tracking-tight overflow-hidden w-full">
          <span className="truncate">lazyseal</span>
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
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Чат</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentTab === "models"}
                  onClick={() => onTabChange("models")}
                >
                  <Download className="h-4 w-4" />
                  <span>Поиск и модели</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentTab === "settings"}
                  onClick={() => onTabChange("settings")}
                >
                  <Settings className="h-4 w-4" />
                  <span>Настройки</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {currentTab === "chat" && (
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 py-1">
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">История чатов</SidebarGroupLabel>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onNewChat}>
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
                      className="group/item flex justify-between pr-1"
                    >
                      <span className="truncate">{chat.title}</span>
                      <button
                        type="button"
                        className="opacity-0 group-hover/item:opacity-100 hover:text-destructive transition-opacity p-1"
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

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
          <span className="group-data-[collapsible=icon]:hidden truncate font-mono">llama.cpp active</span>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  )
}