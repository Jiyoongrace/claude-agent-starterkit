// ⚠️ 이 파일 전체가 추후 실제 에이전트 호출로 교체됩니다
// 각 함수는 PydanticAI Tool, Neo4j 쿼리, Git 파싱 코드로 1:1 교체 예정

export async function mockAgent(scenarioId: string, params: Record<string, unknown>) {
  // 실제 에이전트 호출 시뮬레이션 딜레이
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (scenarioId === "S1") {
    // 🔮 시뮬레이터 에이전트 Mock
    return {
      type: "simulation_table",
      title: "DG320 에러 방지 최적 파라미터 탐색 결과",
      params: {
        error_code: "DG320",
        width: String(params.width ?? 1200),
        thickness: String(params.thickness ?? 8.5),
      },
      results: [
        { 시도: "1", 폭: "1200mm", 두께: "8.5mm", DG320_위험도: "87%", 상태: "❌ 위험" },
        { 시도: "2", 폭: "1150mm", 두께: "8.5mm", DG320_위험도: "43%", 상태: "⚠️ 경고" },
        { 시도: "3", 폭: "1100mm", 두께: "9.0mm", DG320_위험도: "8%", 상태: "✅ 안전" },
      ],
      optimal_index: 2,
    }
  }

  if (scenarioId === "S2") {
    // 🔮 시뮬레이터 에이전트 Mock (Ripple Effect)
    return {
      type: "ripple_effect",
      title: "Edging 기준 변경 → 후공정 파급 효과",
      diagram: `graph LR
A[Edging 기준 변경\\n두께 +0.5mm] -->|영향| B[압연 하중 증가]
B -->|연쇄| C[냉각속도 재계산]
B -->|연쇄| D[롤 교체 주기 단축]
C -->|파급| E[표면 품질 등급 변동]
D -->|파급| F[설비 유지보수 일정 충돌]
style A fill:#4f46e5,color:#fff
style E fill:#ef4444,color:#fff
style F fill:#f97316,color:#fff`,
      timeline: [
        { name: "압연 하중", before: 320, after: 387 },
        { name: "냉각속도(°C/s)", before: 45, after: 39 },
        { name: "표면 품질 점수", before: 92, after: 78 },
        { name: "롤 수명(일)", before: 30, after: 22 },
      ],
    }
  }

  if (scenarioId === "S3") {
    // 🔍 트레이서 에이전트 Mock (Git Timeline)
    return {
      type: "git_timeline",
      title: "Slab 설계 Job 비정상 종료 — 의심 커밋 탐지",
      commits: [
        { hash: "a3f9c21", message: "feat: Slab 두께 계산 로직 수정", author: "kim.dev", date: "2025-03-24 09:12", is_suspect: false },
        { hash: "b71e4d8", message: "fix: 단중 허용 범위 상수값 변경 (320→295)", author: "lee.dev", date: "2025-03-25 14:33", is_suspect: true },
        { hash: "c90a1f3", message: "refactor: Job 스케줄러 타임아웃 조정", author: "park.dev", date: "2025-03-25 17:55", is_suspect: false },
        { hash: "d44b2e7", message: "hotfix: NPE 방지 null 체크 추가", author: "kim.dev", date: "2025-03-26 08:01", is_suspect: false },
      ],
    }
  }

  if (scenarioId === "S4") {
    // 📚 RAG 에이전트 Mock
    return {
      type: "wiki_result",
      content: `## 타겟 단중 (Target Unit Weight)

**단중**이란 제품 단위 길이당 무게(kg/m)를 의미합니다.
열연 공정에서 타겟 단중은 압연 후 최종 제품의 품질 기준이 됩니다.

> 관련 에러코드: DG320 (단중 초과 시 발생)`,
      mappings: [
        { term: "타겟 단중", screen: "품질관리 화면 > 단중 설정 탭", db_table: "TB_SLAB_TARGET", api: "GET /api/slab/target-weight" },
        { term: "DG320", screen: "에러 모니터링 대시보드", db_table: "TB_ERROR_LOG", api: "GET /api/errors/DG320" },
      ],
    }
  }

  if (scenarioId === "S5") {
    // 🔍 트레이서 에이전트 Mock (Graph Path)
    return {
      type: "graph_path",
      title: "열연공장 신설 — 영향받는 소스 컴포넌트 탐색",
      nodes: [
        { id: "1", label: "신규 열연공장\n(HOT_MILL_3)", type: "target" },
        { id: "2", label: "공장 마스터 DB\n(TB_PLANT_MST)", type: "db" },
        { id: "3", label: "생산계획 서비스\n(PlanningAPI)", type: "service" },
        { id: "4", label: "단중 계산 모듈\n(WeightCalc)", type: "code" },
        { id: "5", label: "Edging 기준 테이블\n(TB_EDGE)", type: "db" },
        { id: "6", label: "리포트 생성기\n(ReportGen)", type: "code" },
      ],
      edges: [
        { source: "1", target: "2", label: "등록 필요" },
        { source: "2", target: "3", label: "FK 참조" },
        { source: "3", target: "4", label: "호출" },
        { source: "3", target: "5", label: "조회" },
        { source: "4", target: "6", label: "결과 전달" },
      ],
    }
  }

  if (scenarioId === "S6") {
    // 📚 RAG 에이전트 Mock (Runbook 기반 결재 초안)
    return {
      type: "wiki_result",
      content: `## IRMS 권한 신청 결재 초안 (자동 생성)

**신청 유형:** 신규 화면 접근 권한
**신청자:** ${params.requester ?? "홍길동"}
**대상 화면 ID:** ${params.screen_id ?? "SCR_QUALITY_MGR"}
**요청 권한:** ${params.permission_level ?? "READ_WRITE"}

### 신청 사유
업무상 품질관리 화면의 데이터 입력 및 조회 권한이 필요합니다.

### 결재 라인
1. 팀장 승인 → 2. IT 보안 담당자 확인 → 3. 시스템 관리자 등록

> ⚠️ 위 초안을 검토 후 IRMS 시스템에 직접 등록하세요.`,
      mappings: [],
    }
  }

  if (scenarioId === "S7") {
    // 🔍 트레이서 에이전트 Mock (MSA Diff)
    return {
      type: "msa_diff",
      title: "MSA 설계 대기량 불일치 탐지 — 주문 서비스 vs 생산 서비스",
      service_a: "주문 서비스 (ORDER_DB)",
      service_b: "생산 서비스 (PROD_DB)",
      rows_a: [
        { order_id: "ORD-001", slab_id: "SLB-101", status: "WAITING", qty: "150" },
        { order_id: "ORD-002", slab_id: "SLB-102", status: "WAITING", qty: "200" },
        { order_id: "ORD-003", slab_id: "SLB-103", status: "WAITING", qty: "180" },
      ],
      rows_b: [
        { order_id: "ORD-001", slab_id: "SLB-101", status: "IN_PROGRESS", qty: "150" },
        { order_id: "ORD-002", slab_id: "SLB-102", status: "WAITING", qty: "200" },
        { order_id: "ORD-003", slab_id: "SLB-103", status: "COMPLETED", qty: "95" },
      ],
      diff_keys: ["status", "qty"],
    }
  }

  return { type: "wiki_result", content: "해당 시나리오의 Mock 데이터가 없습니다.", mappings: [] }
}
