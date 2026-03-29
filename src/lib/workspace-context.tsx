"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { ScenarioId } from "./scenarios"
import { AgentResponse } from "@/components/agent/RichRenderer"

// 워크스페이스 4가지 모드
export type WorkspaceMode =
  | { type: "home" }
  | { type: "scenario"; scenarioId: ScenarioId }
  | { type: "result"; scenarioId: ScenarioId; result: AgentResponse }
  | { type: "document"; filePath: string; content: string }

interface WorkspaceContextValue {
  mode: WorkspaceMode
  setMode: (mode: WorkspaceMode) => void
  copilotOpen: boolean
  setCopilotOpen: (open: boolean) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<WorkspaceMode>({ type: "home" })
  const [copilotOpen, setCopilotOpen] = useState(false)

  return (
    <WorkspaceContext.Provider value={{ mode, setMode, copilotOpen, setCopilotOpen }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider")
  return ctx
}
