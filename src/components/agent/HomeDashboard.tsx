"use client"

import { useState, useEffect } from "react"
import { Play, Cpu, Search, GitBranch, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { SCENARIOS, AGENT_BADGE_COLORS } from "@/lib/scenarios"
import { useWorkspace } from "@/lib/workspace-context"

interface BackendStatus {
  connected: boolean
  status?: string
  hybrid_search?: boolean
  reranker?: boolean
  neo4j?: string
  chromadb?: string
}

const AGENT_ICONS = {
  "시뮬레이터": Cpu,
  "트레이서": GitBranch,
  "RAG": Search,
} as const

function StatusDot({ ok, label, detail }: { ok: boolean | string | undefined; label: string; detail?: string }) {
  const isTrue = ok === true || ok === "connected"
  const isPartial = ok === "mock" || ok === false
  const isUnknown = ok === undefined

  return (
    <div className="flex items-center gap-1.5">
      {isUnknown ? (
        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
      ) : isTrue ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      ) : isPartial ? (
        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-red-400" />
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
      {detail && (
        <span className={cn(
          "text-[10px] rounded px-1 py-0.5 font-mono",
          isTrue ? "bg-green-500/10 text-green-600 dark:text-green-400"
            : isPartial ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-muted text-muted-foreground"
        )}>
          {detail}
        </span>
      )}
    </div>
  )
}

export function HomeDashboard() {
  const { setMode } = useWorkspace()
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  async function fetchStatus() {
    setStatusLoading(true)
    try {
      const res = await fetch("/api/health")
      const data = await res.json()
      setBackendStatus(data)
    } catch {
      setBackendStatus({ connected: false, status: "offline" })
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const agentGroups = {
    "시뮬레이터": SCENARIOS.filter(s => s.agent === "시뮬레이터"),
    "트레이서": SCENARIOS.filter(s => s.agent === "트레이서"),
    "RAG": SCENARIOS.filter(s => s.agent === "RAG"),
  } as const

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* 타이틀 */}
        <div>
          <h1 className="text-2xl font-bold">제조 현장 인텔리전스 플랫폼</h1>
          <p className="text-muted-foreground mt-1.5">
            철강/열연 공장 운영을 위한 AI 에이전트 백본 — 시뮬레이터, 트레이서, RAG 에이전트를 통해 현장 이슈를 자율 분석합니다.
          </p>
        </div>

        {/* 백엔드 상태 카드 */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                statusLoading ? "bg-muted animate-pulse"
                  : backendStatus?.connected ? "bg-green-500"
                  : "bg-red-400"
              )} />
              <h2 className="font-semibold text-sm">백엔드 상태</h2>
              <span className={cn(
                "text-[10px] rounded-full px-2 py-0.5 font-medium",
                statusLoading ? "bg-muted text-muted-foreground"
                  : backendStatus?.connected
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              )}>
                {statusLoading ? "확인 중..." : backendStatus?.connected ? "FastAPI 연결됨" : "오프라인 (Mock 모드)"}
              </span>
            </div>
            <button
              onClick={fetchStatus}
              disabled={statusLoading}
              className="rounded-md p-1.5 hover:bg-muted transition-colors disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", statusLoading && "animate-spin")} />
            </button>
          </div>

          {backendStatus && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">하이브리드 검색</p>
                <StatusDot
                  ok={backendStatus.hybrid_search}
                  label={backendStatus.hybrid_search ? "BM25 + 벡터" : "벡터 전용"}
                  detail={backendStatus.hybrid_search ? "RRF 병합" : undefined}
                />
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">리랭커</p>
                <StatusDot
                  ok={backendStatus.reranker}
                  label={backendStatus.reranker ? "Cross-encoder" : "비활성"}
                  detail={backendStatus.reranker ? "MiniLM" : "off"}
                />
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Neo4j 그래프</p>
                <StatusDot
                  ok={backendStatus.neo4j}
                  label={backendStatus.neo4j === "connected" ? "연결됨" : backendStatus.neo4j === "mock" ? "Mock" : "오프라인"}
                  detail={backendStatus.neo4j}
                />
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">ChromaDB</p>
                <StatusDot
                  ok={backendStatus.chromadb === "connected" || backendStatus.chromadb === "ready"}
                  label={backendStatus.chromadb === "connected" || backendStatus.chromadb === "ready" ? "준비됨" : "오프라인"}
                  detail={backendStatus.chromadb}
                />
              </div>
            </div>
          )}

          {!backendStatus && !statusLoading && (
            <p className="text-sm text-muted-foreground">백엔드 상태를 가져올 수 없습니다.</p>
          )}
        </div>

        {/* 에이전트별 시나리오 그룹 */}
        {(Object.entries(agentGroups) as [keyof typeof agentGroups, typeof SCENARIOS[number][]][]).map(([agentName, scenarios]) => {
          const Icon = AGENT_ICONS[agentName]
          return (
            <div key={agentName}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">{agentName} 에이전트</h2>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", AGENT_BADGE_COLORS[agentName])}>
                  {scenarios.length}개 시나리오
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="group flex flex-col rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-2xl">{scenario.agentEmoji}</span>
                      <span className="font-mono text-xs font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                        {scenario.id}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{scenario.title}</h3>
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
          )
        })}
      </div>
    </div>
  )
}
