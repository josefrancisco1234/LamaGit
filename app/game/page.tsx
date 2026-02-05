"use client"

import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { BettingPanel } from "@/components/betting-panel"
import { GlobalChatSidebar } from "@/components/global-chat-sidebar"

export default function GamePage() {
  return (
    <div className="h-screen flex flex-col bg-main-gradient">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Game Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-2xl mx-auto">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">
                Juego de Dados
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Ajusta la probabilidad y tira el dado
              </p>
            </div>

            {/* Betting Panel */}
            <BettingPanel />
          </div>
        </main>

        {/* Chat Sidebar */}
        <GlobalChatSidebar />
      </div>
    </div>
  )
}
