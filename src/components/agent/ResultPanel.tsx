"use client"

import { useState } from "react"
import { Save, Loader2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { SCENARIOS, AGENT_BADGE_COLORS } from "@/lib/scenarios"
import { ScenarioId } from "@/lib/scenarios"
import { AgentResponse, RichRenderer } from "./RichRenderer"
import { useWorkspace } from "@/lib/workspace-context"

interface Props {
  scenarioId: ScenarioId
  result: AgentResponse
}

export function ResultPanel({ scenarioId, result }: Props) {
  const { setMode } = useWorkspace()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const scenario = SCENARIOS.find(s => s.id === scenarioId)!

  async function handleSaveToWiki() {
    setSaving(true)
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
      const filename = `${scenarioId}-result-${timestamp}.md`
      const content = `---
비즈니스_태그: [분석결과, ${scenarioId}]
연관_시나리오: [${scenarioId}]
담당_에이전트: ${scenario.agent}
---

# ${scenario.title} — 분석 결과

> 생성 시각: ${new Date().toLocaleString("ko-KR")}

\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`
`
      await fetch(`/api/files/results/${filename}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode({ type: "scenario", scenarioId })}
            className="rounded-md p-1.5 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-lg">{scenario.agentEmoji}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{scenario.title}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", AGENT_BADGE_COLORS[scenario.agent])}>
                {scenario.agent}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">분석 완료</p>
          </div>
        </div>

        <button
          onClick={handleSaveToWiki}
          disabled={saving || saved}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "저장 완료!" : "결과 저장 → Wiki"}
        </button>
      </div>

      {/* 결과 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <RichRenderer response={result} />
      </div>
    </div>
  )
}
