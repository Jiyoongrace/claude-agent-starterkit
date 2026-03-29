"use client"

import { Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { SCENARIOS, AGENT_BADGE_COLORS } from "@/lib/scenarios"
import { useWorkspace } from "@/lib/workspace-context"

export function HomeDashboard() {
  const { setMode } = useWorkspace()

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">제조 현장 인텔리전스 플랫폼</h1>
          <p className="text-muted-foreground mt-1.5">
            철강/열연 공장 운영을 위한 AI 에이전트 백본 시스템 — 시뮬레이터, 트레이서, RAG 에이전트를 통해 현장 이슈를 분석합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((scenario) => (
            <div
              key={scenario.id}
              className="group flex flex-col rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-2xl">{scenario.agentEmoji}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium shrink-0", AGENT_BADGE_COLORS[scenario.agent])}>
                  {scenario.agent}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-muted-foreground">[{scenario.id}]</span>
                  <h3 className="font-semibold text-sm">{scenario.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{scenario.description}</p>
              </div>

              <button
                onClick={() => setMode({ type: "scenario", scenarioId: scenario.id })}
                className="mt-4 flex items-center justify-center gap-2 w-full rounded-lg border border-primary/30 bg-primary/5 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Play className="h-4 w-4" />
                실행
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
