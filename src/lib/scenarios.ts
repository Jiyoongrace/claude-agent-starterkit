// 7가지 핵심 데모 시나리오 메타데이터

export type AgentType = "시뮬레이터" | "트레이서" | "RAG"
export type ScenarioId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7"

export interface Scenario {
  id: ScenarioId
  title: string
  description: string
  agent: AgentType
  agentEmoji: string
}

export const SCENARIOS: Scenario[] = [
  { id: "S1", title: "DG320 에러 시뮬레이션",       description: "에러 코드 및 파라미터 조작으로 최적값 예측",       agent: "시뮬레이터", agentEmoji: "🔮" },
  { id: "S2", title: "Edging 파생 효과 분석",        description: "기준값 변경이 후공정에 미치는 파급 효과 분석",     agent: "시뮬레이터", agentEmoji: "🔮" },
  { id: "S3", title: "Slab Job 종료 원인 추적",      description: "비정상 종료 Job의 의심 커밋 탐지 및 추적",        agent: "트레이서",   agentEmoji: "🔍" },
  { id: "S4", title: "비즈니스 용어 질의",           description: "단중·에러코드 등 현장 용어 벡터 검색",            agent: "RAG",        agentEmoji: "📚" },
  { id: "S5", title: "열연공장 영향도 파악",         description: "신설 소스·기준이 기존 시스템에 미치는 영향 탐색", agent: "트레이서",   agentEmoji: "🔍" },
  { id: "S6", title: "IRMS 권한 신청 가이드",        description: "Runbook 기반 결재 초안 자동 생성",                agent: "RAG",        agentEmoji: "📚" },
  { id: "S7", title: "MSA 대기량 불일치 추적",       description: "크로스 DB 비교로 데이터 불일치 구간 탐지",        agent: "트레이서",   agentEmoji: "🔍" },
]

export const AGENT_BADGE_COLORS: Record<AgentType, string> = {
  "시뮬레이터": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "트레이서":   "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300",
  "RAG":        "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300",
}
