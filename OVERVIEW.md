# claude-agent-starterkit 프로젝트 개요

> **한 줄 요약**: 제조 현장(철강/열연 공장)의 운영 문제를 AI 에이전트가 자율적으로 분석·시각화하는 멀티 에이전트 백본 플랫폼

---

## 왜 만들었나

철강/열연 공장에서는 매일 다음과 같은 문제가 반복됩니다.

- "DG320 에러가 왜 이렇게 자주 나는 거야? 어떤 파라미터를 바꿔야 하지?"
- "어젯밤 Job이 비정상 종료됐는데, 어느 커밋이 원인이지?"
- "신규 공장 추가했는데 어떤 서비스들이 영향을 받지?"
- "IRMS 권한 신청 절차가 어떻게 되더라?"

기존에는 사람이 직접 DB를 조회하고, Git 로그를 뒤지고, 문서를 찾아 헤맸습니다.

이 프로젝트는 **AI 에이전트가 스스로 도구(Tool)를 사용해 이 과정을 자동화**하고, 결과를 보기 좋게 시각화해 돌려주는 백본 시스템입니다.

---

## 백본 시스템이란

"백본(backbone)"이라는 표현은 이 프로젝트가 **에이전트를 붙이기 위한 틀**이라는 의미입니다.

```
┌─────────────────────────────────────────────────────────┐
│                    백본이 제공하는 것                     │
│                                                         │
│  ✅ 시나리오 실행 UI       ✅ 에이전트 라우팅 오케스트라  │
│  ✅ 응답 타입별 시각화     ✅ Wiki 지식베이스 연동         │
│  ✅ 코파일럿 채팅 패널     ✅ Mock → Real 교체 구조        │
│                                                         │
│  개발자는 Tool 함수만 실제 로직으로 교체하면 됩니다.       │
└─────────────────────────────────────────────────────────┘
```

새 에이전트를 붙이는 과정:
1. `backend/agents/`에 에이전트 파일 추가
2. `backend/tools/`에 Tool 함수 추가 (실제 DB/API 호출)
3. `src/lib/scenarios.ts`에 시나리오 메타데이터 추가
4. `src/components/agent/RichRenderer/`에 시각화 컴포넌트 추가

---

## 전체 아키텍처

세 개의 서버가 동시에 동작합니다.

```
브라우저
    │
    ├──── Next.js (포트 3000) ──────── UI 렌더링, API 프록시
    │         │
    │         │ POST /agent/run
    │         ▼
    │     FastAPI (포트 8000) ──────── 에이전트 실행, Tool 호출
    │         │
    │         ├── Orchestrator
    │         │       ├── 시나리오 S1, S2 → Simulator Agent
    │         │       ├── 시나리오 S3, S5, S7 → Tracer Agent
    │         │       └── 시나리오 S4, S6 → RAG Agent
    │         │
    │         ├── Neo4j AuraDB ──────── 온톨로지 그래프 (시스템 간 관계)
    │         └── ChromaDB ─────────── 벡터 DB (Wiki 문서 RAG)
    │
    └──── Docsify (포트 3001) ──────── Wiki 문서 렌더링
```

---

## 3종 에이전트

### 시뮬레이터 에이전트 (Simulator)

**역할**: 파라미터를 바꿔가며 Tool을 반복 호출해 최적값을 탐색

```
S1: DG320 에러 방지
    → 폭/두께 조합을 여러 번 시뮬레이션
    → 위험도가 가장 낮은 파라미터 조합 반환
    → SimulationTable로 시각화

S2: Edging 기준 변경 파급 효과
    → 기준값 변경 시 후공정(냉각, 권취 등)에 미치는 영향 분석
    → Mermaid 다이어그램 + 타임라인 차트로 시각화
```

---

### 트레이서 에이전트 (Tracer)

**역할**: Git 이력·그래프 DB·DB 데이터를 추적해 원인/영향 경로를 파악

```
S3: Slab Job 비정상 종료 원인 추적
    → Git 로그 파싱 → 의심 커밋 탐지
    → GitTimeline으로 시각화

S5: 신규 공장 신설 영향 컴포넌트 탐색
    → Neo4j 그래프 탐색 (공장 → 관련 서비스 → DB → 화면)
    → ReactFlow 노드 그래프로 시각화

S7: MSA 서비스 간 데이터 불일치 탐지
    → 두 서비스의 DB 데이터 교차 비교
    → MsaDiff 테이블로 불일치 구간 강조
```

---

### RAG 에이전트 (RAG)

**역할**: Wiki 문서를 벡터 검색해 현장 지식을 답변에 활용

```
S4: 비즈니스 용어 질의
    → ChromaDB에서 용어 검색 (단중, DG320, Edging 등)
    → 정의 + 관련 화면/DB/API 매핑 테이블로 반환

S6: IRMS 권한 신청 결재 초안 생성
    → Runbook 문서 검색
    → 신청자/화면/권한 레벨에 맞는 결재 초안 자동 작성
```

---

## 7개 시나리오 전체 목록

| ID | 에이전트 | 시나리오 | 출력 형태 |
|----|---------|---------|---------|
| S1 | 시뮬레이터 | DG320 에러 방지 최적 파라미터 탐색 | 파라미터 비교 테이블 |
| S2 | 시뮬레이터 | Edging 기준 변경 파급 효과 분석 | Mermaid 다이어그램 + 차트 |
| S3 | 트레이서 | Slab Job 비정상 종료 원인 추적 | 커밋 타임라인 |
| S4 | RAG | 비즈니스 용어 정의 및 매핑 조회 | 마크다운 + 매핑 테이블 |
| S5 | 트레이서 | 신규 공장 신설 영향 컴포넌트 탐색 | ReactFlow 노드 그래프 |
| S6 | RAG | IRMS 권한 신청 결재 초안 생성 | 마크다운 (결재 초안) |
| S7 | 트레이서 | MSA 서비스 간 데이터 불일치 탐지 | 좌우 비교 테이블 |

---

## RichRenderer — 응답 타입별 시각화

에이전트가 반환하는 JSON의 `type` 필드에 따라 6가지 렌더러로 자동 분기됩니다.

```
에이전트 응답 JSON
    {
      "type": "simulation_table",   ← 이 필드로 렌더러 결정
      "title": "...",
      "results": [...]
    }
         │
         ▼
    RichRenderer (분기)
         ├── simulation_table → SimulationTable (파라미터 비교)
         ├── ripple_effect    → RippleEffect (Mermaid + Recharts)
         ├── git_timeline     → GitTimeline (커밋 타임라인)
         ├── graph_path       → GraphPath (ReactFlow 그래프)
         ├── wiki_result      → WikiResult (마크다운)
         └── msa_diff         → MsaDiff (서비스 비교 테이블)
```

프론트엔드 응답 타입(`src/components/agent/RichRenderer/`)과
백엔드 Pydantic 모델(`backend/models/response_models.py`)이 **1:1 대응**합니다.

---

## UI 구조

3단 레이아웃으로 구성됩니다.

```
┌──────────────┬───────────────────────────┬────────────────┐
│   Sidebar    │       메인 패널            │  Copilot 패널  │
│              │                           │                │
│ [시나리오]   │  home → HomeDashboard     │  Groq LLaMA    │
│  S1 DG320   │  scenario → ScenarioPanel │  채팅 인터페이스 │
│  S2 Edging  │  result → ResultPanel     │                │
│  S3 Job추적  │         + RichRenderer    │  Quick 질문:   │
│  ...        │  document → Workspace     │  "DG320 원인?" │
│             │            (MD 편집기)     │  "단중 뜻이?" │
│ [Wiki 파일] │                           │                │
│  /standards │                           │                │
│  /runbooks  │                           │                │
└──────────────┴───────────────────────────┴────────────────┘
```

---

## Mock → Real 전환 전략

현재는 Tool 함수들이 Mock 데이터를 반환합니다.
**에이전트 로직은 그대로 두고, Tool 함수만 교체**하면 실제 시스템과 연동됩니다.

| 우선순위 | 파일 | 현재 (Mock) | 교체 대상 |
|---------|------|------------|---------|
| 1 | `tools/simulation_tools.py` | 선형 근사 계산 | 실제 공정 시뮬레이터 |
| 2 | `graph/ontology_loader.py` | 하드코딩 노드/엣지 | OT DB 연동 후 실제 스키마 |
| 3 | `tools/db_tools.py` | 하드코딩 Mock 테이블 | 실제 DB 쿼리 (OT 연동 승인 후) |
| 4 | `tools/git_tools.py` | 하드코딩 커밋 로그 | 실제 `git log` 파싱 |

> OT(운영 DB) 연동 승인 전까지는 Mock으로 전체 파이프라인을 시연 가능합니다.

---

## 에이전트 설계 원칙

- **단순 챗봇 금지**: 에이전트는 반드시 Tool을 실행한 뒤 답변
- **Rule Base 금지**: if-else 하드코딩 대신 에이전트가 스스로 Tool 선택
- **ReAct 패턴**: 가설 수립 → Tool 실행 → 결과 검증 → 재시도

---

## onTong 패턴 적용 — 검색·스킬·스트리밍 업그레이드

[onTong](https://github.com/Jeensh/onTong) 프로젝트의 AI 위키 기술을 백엔드에 이식했습니다.

### 하이브리드 검색 (RAG 품질 향상)

```
기존: ChromaDB 벡터 검색만 사용
      → 정확한 키워드(DG320)를 놓칠 수 있음

개선: BM25 키워드 검색 + ChromaDB 벡터 검색 → RRF로 병합
      → 키워드와 의미 모두 잡음
      → ENABLE_HYBRID_SEARCH=true 환경변수로 활성화
```

### 스킬 시스템 (에이전트 행동 파일 기반 관리)

```
기존: 에이전트 지시문이 Python 코드 안에 하드코딩
      → 수정 시 서버 재배포 필요

개선: wiki_data/_skills/*.md 파일로 분리
      → 파일만 수정하면 에이전트 행동 즉시 변경
      → 6-Layer 구조 (역할→워크플로우→지시→체크→출력→제한)
```

### SSE 스트리밍 (실시간 피드백)

```
기존: POST /agent/run → 전체 완료 후 응답
      → 긴 실행 시간 동안 빈 화면

개선: POST /agent/run/stream → SSE로 실시간 이벤트 전송
      event: thinking → 실행 시작 알림
      event: result   → 분석 결과
```

### Wiki Chat 엔드포인트

```
POST /chat → Wiki 문서 컨텍스트 + Claude API 스트리밍 채팅
           → "DG320 에러가 뭔가요?" 같은 자유 질문 가능
           → 답변 출처 문서 목록 함께 반환
```

> 자세한 내용은 [`backend/README.md`](./backend/README.md)를 참고하세요.

---

## 빠른 시작

```bash
# 터미널 1 — Next.js 프론트엔드 (포트 3000)
npm run dev

# 터미널 2 — FastAPI 백엔드 (포트 8000)
cd backend && uv run uvicorn main:app --reload --port 8000

# 터미널 3 — Docsify Wiki (포트 3001, 선택)
docsify serve wiki_data --port 3001
```

환경변수는 `backend/.env`와 `.env.local`을 참고하세요. (README.md 환경변수 섹션)

---

## 관련 문서

| 문서 | 내용 |
|-----|------|
| `README.md` | 기술 스택, API 엔드포인트, 의존성 설치 |
| `backend/README.md` | 백엔드 입문자 가이드 (개념 설명, 신규 기능 포함) |
| `CLAUDE.md` | 개발자 가이드 (아키텍처 상세, 스타일링 규칙) |
| `OVERVIEW.md` | 이 문서 — 프로젝트 전체 개요 |
| `wiki_data/` | 현장 용어, 에러코드 가이드, Runbook |
| `wiki_data/_skills/` | 에이전트 스킬 파일 (S1~S7) |
