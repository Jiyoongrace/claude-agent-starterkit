"use client"

import { Bot, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace-context"
import { Sidebar } from "@/components/agent/Sidebar"
import { CopilotPanel } from "@/components/agent/CopilotPanel"

function AgentLayoutInner({ children }: { children: React.ReactNode }) {
  const { copilotOpen, setCopilotOpen } = useWorkspace()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* 상단 헤더 바 */}
      <header className="shrink-0 flex items-center justify-between border-b px-4 py-2.5 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">제조 현장 인텔리전스</span>
          <span className="hidden sm:inline text-xs text-muted-foreground">AI 에이전트 플랫폼</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCopilotOpen(!copilotOpen)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
              copilotOpen ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            AI 코파일럿
          </button>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="rounded-md p-1.5 hover:bg-muted border"
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 3단 레이아웃 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 — 에이전트 네비게이터 */}
        <div className="w-60 shrink-0 overflow-hidden">
          <Sidebar />
        </div>

        {/* 중앙 — 메인 워크스페이스 */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>

        {/* 우측 — AI 코파일럿 패널 (조건부) */}
        {copilotOpen && (
          <div className="w-80 shrink-0 overflow-hidden">
            <CopilotPanel />
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <AgentLayoutInner>{children}</AgentLayoutInner>
    </WorkspaceProvider>
  )
}
