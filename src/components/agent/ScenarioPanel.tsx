"use client"

import { useState } from "react"
import { Play, Loader2, Cpu, Search, GitBranch, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { SCENARIOS, AGENT_BADGE_COLORS } from "@/lib/scenarios"
import { ScenarioId } from "@/lib/scenarios"
import { useWorkspace } from "@/lib/workspace-context"
import { AgentResponse } from "./RichRenderer"

interface Props {
  scenarioId: ScenarioId
}

// 에이전트별 실행 단계 메시지
const AGENT_STEPS: Record<string, string[]> = {
  "시뮬레이터": ["파라미터 범위 설정 중...", "시뮬레이션 실행 중...", "최적 조합 계산 중..."],
  "트레이서": ["데이터 소스 연결 중...", "이력 탐색 중...", "원인 경로 추적 중..."],
  "RAG": ["Wiki 문서 검색 중...", "관련 문서 순위 계산 중...", "답변 생성 중..."],
}

export function ScenarioPanel({ scenarioId }: Props) {
  const { setMode } = useWorkspace()
  const [loading, setLoading] = useState(false)
  const [thinkingMsg, setThinkingMsg] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const scenario = SCENARIOS.find(s => s.id === scenarioId)!

  const [params, setParams] = useState<Record<string, string>>({
    error_code: "DG320", width: "1200", thickness: "8.5",
    edging_value: "",
    job_id: "JOB-2025-0325", date_from: "2025-03-20", date_to: "2025-03-26",
    term: "",
    factory_name: "HOT_MILL_3", systems: "",
    requester: "", screen_id: "SCR_QUALITY_MGR", permission_level: "READ_WRITE",
    service_a: "ORDER_DB", service_b: "PROD_DB",
  })

  function set(key: string, value: string) {
    setParams(p => ({ ...p, [key]: value }))
  }

  async function handleRun() {
    setLoading(true)
    setError(null)
    setThinkingMsg(null)
    setStepIndex(0)

    const steps = AGENT_STEPS[scenario.agent] ?? ["분석 중..."]

    // 단계 메시지 순환 (SSE thinking 이벤트 수신 전 fallback)
    const stepTimer = setInterval(() => {
      setStepIndex(i => {
        const next = i + 1
        if (next < steps.length) return next
        return i
      })
    }, 1800)

    try {
      const res = await fetch("/api/agent/run/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_id: scenarioId, params }),
      })

      if (!res.ok || !res.body) {
        setError("서버에 연결할 수 없습니다.")
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const blocks = buffer.split("\n\n")
        buffer = blocks.pop() ?? ""

        for (const block of blocks) {
          const eventLine = block.split("\n").find(l => l.startsWith("event:"))
          const dataLine  = block.split("\n").find(l => l.startsWith("data:"))
          if (!dataLine) continue

          const event = eventLine?.replace("event:", "").trim()
          const rawData = dataLine.replace("data:", "").trim()

          try {
            const data = JSON.parse(rawData)

            if (event === "thinking") {
              setThinkingMsg(data.message ?? null)
            } else if (event === "result") {
              clearInterval(stepTimer)
              setMode({ type: "result", scenarioId, result: data as AgentResponse })
              return
            } else if (event === "error") {
              setError(data.detail ?? "에이전트 오류가 발생했습니다.")
              return
            }
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } catch {
      setError("서버에 연결할 수 없습니다.")
    } finally {
      clearInterval(stepTimer)
      setLoading(false)
      setThinkingMsg(null)
    }
  }

  const agentSteps = AGENT_STEPS[scenario.agent] ?? ["분석 중..."]

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="shrink-0 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{scenario.agentEmoji}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base">{scenario.title}</h2>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", AGENT_BADGE_COLORS[scenario.agent])}>
                {scenario.agent}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{scenario.description}</p>
          </div>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-lg space-y-5">
          {scenarioId === "S1" && (
            <>
              <Field label="에러 코드">
                <input value={params.error_code} onChange={e => set("error_code", e.target.value)}
                  className="input-field" placeholder="예: DG320" />
              </Field>
              <Field label={`폭 (width): ${params.width}mm`}>
                <input type="range" min={900} max={1300} value={params.width}
                  onChange={e => set("width", e.target.value)} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>900mm</span><span>1300mm</span>
                </div>
              </Field>
              <Field label={`두께 (thickness): ${params.thickness}mm`}>
                <input type="range" min={6} max={12} step={0.5} value={params.thickness}
                  onChange={e => set("thickness", e.target.value)} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>6mm</span><span>12mm</span>
                </div>
              </Field>
            </>
          )}

          {scenarioId === "S2" && (
            <Field label="변경된 Edging 기준값">
              <input value={params.edging_value} onChange={e => set("edging_value", e.target.value)}
                className="input-field" placeholder="예: 두께 허용 공차 ±0.3 → ±0.5mm" />
            </Field>
          )}

          {scenarioId === "S3" && (
            <>
              <Field label="Job ID">
                <input value={params.job_id} onChange={e => set("job_id", e.target.value)}
                  className="input-field" placeholder="예: JOB-2025-0325" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="시작 날짜">
                  <input type="date" value={params.date_from} onChange={e => set("date_from", e.target.value)}
                    className="input-field" />
                </Field>
                <Field label="종료 날짜">
                  <input type="date" value={params.date_to} onChange={e => set("date_to", e.target.value)}
                    className="input-field" />
                </Field>
              </div>
            </>
          )}

          {scenarioId === "S4" && (
            <Field label="비즈니스 용어 검색">
              <input value={params.term} onChange={e => set("term", e.target.value)}
                className="input-field" placeholder="예: 단중, DG320, 타겟 단중" />
              <p className="text-xs text-muted-foreground mt-1">
                하이브리드 검색(BM25 + 벡터) 적용 — Wiki 문서에서 정밀 탐색합니다
              </p>
            </Field>
          )}

          {scenarioId === "S5" && (
            <>
              <Field label="신규 공장명">
                <input value={params.factory_name} onChange={e => set("factory_name", e.target.value)}
                  className="input-field" placeholder="예: HOT_MILL_3" />
              </Field>
              <Field label="연동 대상 시스템 (쉼표 구분)">
                <input value={params.systems} onChange={e => set("systems", e.target.value)}
                  className="input-field" placeholder="예: PlanningAPI, WeightCalc, ReportGen" />
              </Field>
            </>
          )}

          {scenarioId === "S6" && (
            <>
              <Field label="신청자 이름">
                <input value={params.requester} onChange={e => set("requester", e.target.value)}
                  className="input-field" placeholder="예: 홍길동" />
              </Field>
              <Field label="화면 ID">
                <input value={params.screen_id} onChange={e => set("screen_id", e.target.value)}
                  className="input-field" placeholder="예: SCR_QUALITY_MGR" />
              </Field>
              <Field label="권한 레벨">
                <select value={params.permission_level} onChange={e => set("permission_level", e.target.value)}
                  className="input-field">
                  <option value="READ">READ — 조회만</option>
                  <option value="READ_WRITE">READ_WRITE — 입력/수정</option>
                  <option value="ADMIN">ADMIN — 관리자</option>
                </select>
              </Field>
            </>
          )}

          {scenarioId === "S7" && (
            <>
              <Field label="서비스 A">
                <select value={params.service_a} onChange={e => set("service_a", e.target.value)}
                  className="input-field">
                  <option value="ORDER_DB">주문 서비스 (ORDER_DB)</option>
                  <option value="PROD_DB">생산 서비스 (PROD_DB)</option>
                </select>
              </Field>
              <Field label="서비스 B">
                <select value={params.service_b} onChange={e => set("service_b", e.target.value)}
                  className="input-field">
                  <option value="PROD_DB">생산 서비스 (PROD_DB)</option>
                  <option value="ORDER_DB">주문 서비스 (ORDER_DB)</option>
                </select>
              </Field>
            </>
          )}
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="shrink-0 mx-6 mb-2 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 실행 버튼 + 스트리밍 상태 */}
      <div className="shrink-0 border-t px-6 py-4 space-y-3">
        {loading && (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2">
            {/* 현재 단계 메시지 */}
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <span className="text-foreground">
                {thinkingMsg ?? agentSteps[Math.min(stepIndex, agentSteps.length - 1)]}
              </span>
            </div>

            {/* 단계 프로그레스 점 */}
            <div className="flex items-center gap-1.5 pl-6">
              {agentSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors duration-500",
                    i <= (thinkingMsg ? agentSteps.length - 1 : stepIndex)
                      ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                  {i < agentSteps.length - 1 && (
                    <div className="h-px w-4 bg-muted-foreground/20" />
                  )}
                </div>
              ))}
            </div>

            {/* 에이전트 타입 정보 */}
            <div className="flex items-center gap-3 pl-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {scenario.agent === "시뮬레이터" && <Cpu className="h-3 w-3" />}
                {scenario.agent === "트레이서"   && <GitBranch className="h-3 w-3" />}
                {scenario.agent === "RAG"         && <Search className="h-3 w-3" />}
                {scenario.agent} 에이전트 실행 중
              </span>
              {(scenarioId === "S4" || scenarioId === "S6") && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  하이브리드 검색
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {loading ? "AI 분석 중..." : "분석 실행"}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}
