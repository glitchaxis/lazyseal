import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { ChatView } from "@/components/views/ChatView"
import { ModelsView } from "@/components/views/ModelsView"
import { SettingsView } from "@/components/views/SettingsView"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useChats } from "@/hooks/useChats"
import { useModels } from "@/hooks/useModels"

export function App() {
  const [currentTab, setCurrentTab] = useState<"chat" | "models" | "settings">("chat")
  const [model, setModel] = useState("")
  const [useReasoning, setUseReasoning] = useState(true)
  const [isFilesPanelOpen, setIsFilesPanelOpen] = useState(false)

  const {
    chats,
    activeChatId,
    setActiveChatId,
    currentMessages,
    isLoading,
    handleNewChat,
    handleDeleteChat,
    sendMessage,
  } = useChats()

  const {
    hfSearchQuery,
    setHfSearchQuery,
    hfModels,
    isHfLoading,
    downloads,
    localModels,
    activeModelPath,
    searchHfModels,
    downloadModel,
    startModelServer,
  } = useModels()

  useEffect(() => {
    if (currentTab === "models") {
      searchHfModels()
    }
  }, [currentTab])

  useEffect(() => {
    if (!model && localModels.length > 0) {
      setModel(localModels[0].name)
    }
  }, [localModels, model])

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground select-none">
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            currentTab={currentTab}
            isFilesPanelOpen={isFilesPanelOpen}
            setIsFilesPanelOpen={setIsFilesPanelOpen}
          />

<main 
  key={currentTab}
  className={`flex-1 flex flex-col bg-background p-6 ${
    currentTab === "chat" ? "overflow-hidden" : "overflow-y-auto"
  }`}
  style={{ animation: "fadeIn 0.2s ease-in-out" }}
>
  {currentTab === "chat" && (
    <ChatView
      messages={currentMessages}
      isLoading={isLoading}
      onSendMessage={(text) => sendMessage(text, model, useReasoning)}
      model={model}
      setModel={setModel}
      localModels={localModels}
      onSelectModel={(path) => startModelServer(path)}
      useReasoning={useReasoning}
      setUseReasoning={setUseReasoning}
      isFilesPanelOpen={isFilesPanelOpen}
      setIsFilesPanelOpen={setIsFilesPanelOpen}
    />
  )}

  {currentTab === "models" && (
    <ModelsView
      searchQuery={hfSearchQuery}
      setSearchQuery={setHfSearchQuery}
      models={hfModels}
      isLoading={isHfLoading}
      downloads={Object.values(downloads)}
      localModels={localModels}
      onSearch={searchHfModels}
      onDownload={downloadModel}
      startModelServer={startModelServer}
    />
  )}

  {currentTab === "settings" && (
    <SettingsView
      activeModelPath={activeModelPath}
      startModelServer={startModelServer}
    />
  )}
</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default App