# 백엔드 개발 가이드

> **처음 보는 분을 위한 한 줄 설명**: 이 백엔드는 "AI 에이전트가 공장 데이터를 스스로 조회·분석하고, 그 결과를 프론트엔드에 전달하는 서버"입니다.

---

## 목차

1. [백엔드가 하는 일](#1-백엔드가-하는-일)
2. [기술 스택 — 쉬운 설명](#2-기술-스택--쉬운-설명)
3. [디렉토리 구조](#3-디렉토리-구조)
4. [핵심 개념 4가지](#4-핵심-개념-4가지)
5. [새로 추가된 기능 (onTong 패턴 적용)](#5-새로-추가된-기능-ontong-패턴-적용)
6. [API 엔드포인트](#6-api-엔드포인트)
7. [환경변수 가이드](#7-환경변수-가이드)
8. [서버 실행 방법](#8-서버-실행-방법)
9. [Mock → 실제 전환 방법](#9-mock--실제-전환-방법)

---

## 1. 백엔드가 하는 일

프론트엔드(화면)에서 버튼을 누르면 다음 일이 일어납니다.

```
사용자가 "S1 시나리오 실행" 버튼 클릭
    │
    ▼
프론트엔드(Next.js)가 백엔드에 요청을 보냄
    POST /agent/run  {"scenario_id": "S1", ...}
    │
    ▼
백엔드(FastAPI)가 요청을 받아 AI 에이전트를 실행
    │
    ├── 에이전트가 Tool을 호출 (시뮬레이션 계산, DB 조회, Git 파싱 등)
    │
    └── 분석 결과를 JSON으로 반환
    │
    ▼
프론트엔드가 결과를 받아 차트·테이블·그래프로 시각화
```

**백엔드는 "AI 에이전트의 실행 엔진"** 역할을 합니다. 사람 대신 에이전트가 스스로 데이터를 찾고 분석합니다.

---

## 2. 기술 스택 — 쉬운 설명

| 도구 | 역할 | 비유 |
|------|------|------|
| **FastAPI** | 웹 서버 프레임워크 | "주문을 받는 카운터" |
| **PydanticAI** | AI 에이전트 실행 엔진 | "실제로 일하는 AI 직원" |
| **ChromaDB** | 문서 벡터 검색 DB | "의미를 이해하는 검색 엔진" |
| **BM25** | 키워드 검색 엔진 | "일반적인 키워드 검색" |
| **Neo4j** | 그래프 데이터베이스 | "시스템 간 관계도 저장소" |
| **uv** | Python 패키지 관리자 | "npm과 같은 역할" |

### FastAPI란?

Python으로 HTTP API 서버를 만드는 프레임워크입니다. "특정 URL로 요청이 오면 이 함수를 실행해라"를 정의합니다.

```python
@app.post("/agent/run")        # POST 요청이 /agent/run으로 오면
async def agent_run(request):  # 이 함수를 실행
    result = await run_scenario(request)
    return result
```

### PydanticAI란?

Claude 같은 LLM(언어 모델)을 "에이전트"로 감싸서, 도구(Tool)를 스스로 선택하고 실행하게 만드는 프레임워크입니다. 에이전트는 단순히 텍스트를 생성하는 게 아니라 **실제 함수를 호출**합니다.

```python
agent = Agent(model="claude-sonnet-...", output_type=SimulationResult)

@agent.tool_plain
async def run_simulation(width: float, thickness: float) -> dict:
    # 에이전트가 필요하다고 판단하면 이 함수를 스스로 호출
    return calculate_risk(width, thickness)
```

### ChromaDB + BM25 (하이브리드 검색)란?

Wiki 문서에서 관련 내용을 찾는 두 가지 방법을 합친 것입니다.

- **ChromaDB (벡터 검색)**: 단어가 달라도 "의미가 비슷하면" 찾아줌
  - "단중 기준" 검색 → "목표 중량 설정" 문서도 찾아줌
- **BM25 (키워드 검색)**: 입력한 단어가 정확히 있으면 찾아줌
  - "DG320" 검색 → "DG320"이 포함된 문서 위주로 찾아줌
- **RRF 병합**: 두 결과를 섞어서 더 정확한 순위를 만듦

---

## 3. 디렉토리 구조

```
backend/
│
├── main.py                  ← FastAPI 서버 시작점. 모든 API 엔드포인트 정의
├── pyproject.toml           ← 설치할 Python 패키지 목록
├── .env                     ← API 키, DB 연결 정보 등 환경변수
│
├── agents/                  ← AI 에이전트 정의
│   ├── orchestrator.py      │  시나리오 ID를 보고 어느 에이전트를 실행할지 결정
│   ├── simulator_agent.py   │  S1·S2: 공정 시뮬레이션
│   ├── tracer_agent.py      │  S3·S5·S7: Git·그래프·DB 추적
│   └── rag_agent.py         │  S4·S6: Wiki 문서 검색
│
├── tools/                   ← 에이전트가 실제로 사용하는 도구 함수
│   ├── simulation_tools.py  │  DG320 위험도 계산, 파급효과 분석 (현재 Mock)
│   ├── graph_tools.py       │  Neo4j 그래프 탐색 (현재 Mock)
│   ├── git_tools.py         │  Git 커밋 이력 파싱 (현재 Mock)
│   ├── db_tools.py          │  DB 데이터 조회 (현재 Mock)
│   └── wiki_tools.py        │  Wiki 문서 검색 (ChromaDB + BM25)
│
├── models/                  ← 데이터 형식 정의
│   ├── request_models.py    │  요청 형식: 시나리오 ID, 파라미터
│   └── response_models.py   │  응답 형식: 6가지 시각화 타입
│
├── vector/                  ← 문서 검색 엔진
│   ├── chroma_client.py     │  ChromaDB 연결 관리
│   ├── wiki_indexer.py      │  Wiki 마크다운 파일 → ChromaDB에 저장
│   ├── hybrid_search.py     │  BM25 + ChromaDB 하이브리드 검색 ← 신규
│   └── reranker.py          │  검색 결과 정밀 재정렬 ← 신규
│
├── skills/                  ← AI 에이전트 프롬프트 파일 관리 ← 신규
│   ├── loader.py            │  스킬 마크다운 파일 로딩
│   └── matcher.py           │  시나리오·키워드로 스킬 자동 선택
│
└── graph/                   ← 그래프 DB 연결
    ├── neo4j_client.py      │  Neo4j 드라이버 연결 (Mock 모드 지원)
    └── ontology_loader.py   │  온톨로지 초기 데이터 로딩
```

---

## 4. 핵심 개념 4가지

### 개념 1: 에이전트 (Agent)

에이전트는 LLM(Claude 등)에 "역할"과 "도구"를 부여한 것입니다.

```
일반 LLM:  질문을 받으면 → 텍스트로 답변
에이전트:  질문을 받으면 → Tool을 호출해 데이터를 수집 → 분석 결과를 반환
```

이 프로젝트에는 3종류의 에이전트가 있습니다.

| 에이전트 | 담당 시나리오 | 주요 Tool |
|---------|-------------|---------|
| **Simulator** | S1, S2 | `run_dg320_simulation()`, `analyze_ripple_effect()` |
| **Tracer** | S3, S5, S7 | `parse_git_log()`, `traverse_factory_impact()`, `get_order_data()` |
| **RAG** | S4, S6 | `search_term()`, `get_runbook()` |

### 개념 2: Tool (도구)

에이전트가 직접 호출하는 Python 함수입니다. 에이전트가 "지금 이 Tool이 필요하다"고 스스로 판단하면 호출합니다.

```python
# 에이전트에게 이런 도구를 줌
@agent.tool_plain
async def run_dg320_simulation(width: float, thickness: float) -> dict:
    """폭/두께 조합의 DG320 위험도를 계산합니다."""
    risk = (width - 1000) * 0.15 + (9.0 - thickness) * 20
    return {"dg320_risk": risk, "status": "안전" if risk < 30 else "위험"}

# 에이전트 실행 시 내부적으로 이런 일이 일어남:
# 1. 사용자: "DG320 위험도가 낮은 파라미터를 찾아줘"
# 2. 에이전트: "run_dg320_simulation(1100, 9.0)을 호출해야겠다" (스스로 판단)
# 3. 에이전트: "결과를 보니 위험도가 낮군. 다른 조합도 시도해보자"
# 4. 에이전트: "3가지 조합 중 두 번째가 가장 낮다. 이걸 반환하자"
```

### 개념 3: 오케스트레이터 (Orchestrator)

프론트엔드에서 "S3 실행!"이라는 요청이 오면, 어느 에이전트를 실행할지 결정하는 라우터입니다.

```
요청: {"scenario_id": "S3"}
    │
    ▼
orchestrator.py
    │
    ├── S1, S2 → simulator_agent 실행
    ├── S3, S5, S7 → tracer_agent 실행
    └── S4, S6 → rag_agent 실행
```

### 개념 4: 응답 타입 (Response Type)

에이전트는 분석 결과를 일반 텍스트가 아닌 **구조화된 JSON**으로 반환합니다. 프론트엔드는 `type` 필드를 보고 어떤 시각화로 보여줄지 결정합니다.

```json
{
  "type": "simulation_table",   ← 이 값으로 렌더러 결정
  "title": "DG320 최적 파라미터 탐색",
  "results": [
    {"시도": "1", "폭": "1100mm", "두께": "9.0mm", "DG320_위험도": "12.5%", "상태": "✅ 안전"},
    {"시도": "2", "폭": "1200mm", "두께": "8.5mm", "DG320_위험도": "34.0%", "상태": "⚠️ 경고"}
  ],
  "optimal_index": 0
}
```

| type | 프론트 렌더러 | 어떻게 보이나 |
|------|------------|------------|
| `simulation_table` | SimulationTable | 파라미터 비교 표 |
| `ripple_effect` | RippleEffect | 흐름 다이어그램 + 시계열 차트 |
| `git_timeline` | GitTimeline | 커밋 타임라인 (의심 커밋 빨간색) |
| `graph_path` | GraphPath | 노드-엣지 관계 그래프 |
| `wiki_result` | WikiResult | 마크다운 본문 + 매핑 표 |
| `msa_diff` | MsaDiff | 두 서비스 데이터 비교 표 |

---

## 5. 새로 추가된 기능 (onTong 패턴 적용)

[onTong](https://github.com/Jeensh/onTong) 프로젝트의 핵심 기술 4가지를 이 백엔드에 적용했습니다.

---

### 5-1. 하이브리드 검색 (`vector/hybrid_search.py`)

**문제**: ChromaDB 벡터 검색만 쓰면 정확한 키워드(예: "DG320")를 검색할 때 놓칠 수 있습니다.

**해결**: BM25 키워드 검색과 벡터 검색을 합쳐서 더 정확하게 찾습니다.

```
검색어: "DG320 단중 에러"
    │
    ├── ChromaDB 벡터 검색 → [문서A 1위, 문서C 2위, 문서B 3위, ...]
    │   (의미 기반: "단중 초과 에러"도 포함)
    │
    ├── BM25 키워드 검색 → [문서A 1위, 문서B 2위, 문서D 3위, ...]
    │   (정확한 키워드: "DG320"이 있는 문서 우선)
    │
    └── RRF 병합 → [문서A 1위, 문서B 2위, 문서C 3위]
        (두 결과를 가중 평균으로 합산)
```

**RRF(Reciprocal Rank Fusion)**란? 두 검색 결과 목록을 "순위 기반"으로 합산하는 방식입니다.
- 두 목록 모두에서 상위에 있는 문서가 최종 상위권
- 어느 한 쪽에서만 높은 문서도 고려

**활성화 방법**: `.env` 파일에서 `ENABLE_HYBRID_SEARCH=true` 설정 (기본값: `true`)

---

### 5-2. Cross-encoder 리랭킹 (`vector/reranker.py`)

**문제**: 하이브리드 검색으로 찾은 문서 순위가 실제 쿼리와 잘 맞지 않을 수 있습니다.

**해결**: AI 모델이 "이 쿼리에 대해 이 문서가 얼마나 적합한가"를 직접 점수 매깁니다.

```
하이브리드 검색 결과 상위 5개
    │
    ▼
Cross-encoder 모델이 쿼리와 각 문서를 쌍으로 비교
    (쿼리, 문서A) → 점수 0.87
    (쿼리, 문서B) → 점수 0.45
    (쿼리, 문서C) → 점수 0.91  ← 리랭킹 후 1위
    │
    ▼
점수 순으로 재정렬 → 상위 3개 반환
```

**주의**: `sentence-transformers` 라이브러리가 무겁습니다(~500MB). 기본값은 비활성화.

**활성화 방법**: `.env`에서 `ENABLE_RERANKER=true` 설정 (최초 실행 시 모델 자동 다운로드)

---

### 5-3. 스킬 시스템 (`skills/` + `wiki_data/_skills/`)

**문제**: 에이전트의 "역할 지시문(시스템 프롬프트)"이 Python 코드 안에 하드코딩되어 있었습니다. 수정하려면 코드를 배포해야 했습니다.

**해결**: 에이전트 지시문을 마크다운 파일로 분리해서, 코드 배포 없이 파일만 수정하면 에이전트 행동이 바뀝니다.

**스킬 파일 구조** (`wiki_data/_skills/s4-wiki-search.md`):

```markdown
---
skill_id: s4_wiki_search
keywords: [단중, DG320, 에러코드, 용어, 검색]
scenarios: [S4]
---

## 역할 (Role)
당신은 제조 현장 Wiki 검색 전문 AI 에이전트입니다.

## 워크플로우 (Workflow)
1. search_term Tool 호출
2. 결과 구조화
3. WikiResult 형식으로 반환

## 지시사항 (Instructions)
- 반드시 search_term Tool을 호출하세요
- Tool 없이 임의로 설명하는 것을 금지합니다

## 체크리스트 (Checklist)
- [ ] search_term Tool 호출 완료
- [ ] content 필드에 마크다운 포함

## 출력 형식 (Output Format)
WikiResult (type="wiki_result")

## 제한사항 (Constraints)
- Tool 호출 없이 답변 금지
```

**6-Layer 구조**란? 에이전트에게 "역할 → 순서 → 구체적 규칙 → 체크리스트 → 출력형식 → 금지사항" 순서로 지시하는 방식입니다. 각 레이어를 채울수록 에이전트 답변 품질이 높아집니다.

**스킬 파일 위치**: `wiki_data/_skills/` (총 7개, 시나리오 S1~S7 각각)

---

### 5-4. SSE 스트리밍 (`POST /agent/run/stream`)

**문제**: 에이전트 실행이 오래 걸릴 때 프론트엔드에서 "로딩 중..."만 보입니다.

**해결**: SSE(Server-Sent Events)를 사용해서 진행 상황을 실시간으로 전송합니다.

```
클라이언트 ──요청──▶ POST /agent/run/stream
                            │
클라이언트 ◀── event: thinking ── "시나리오 S4 실행 중..."
            (즉시 수신)
                            │ (에이전트 실행 중...)
                            │
클라이언트 ◀── event: result ── {type: "wiki_result", content: "..."}
            (완료 후 수신)
```

**SSE란?** HTTP 연결을 유지한 채로 서버가 클라이언트에 데이터를 여러 번 보낼 수 있는 기술입니다. 채팅 앱의 스트리밍과 같은 원리입니다.

---

### 5-5. Wiki Chat 엔드포인트 (`POST /chat`)

Wiki 문서를 참고한 AI 채팅 기능입니다. 기존 에이전트와 달리 자유로운 대화 형식으로 질문할 수 있습니다.

```
사용자: "DG320 에러가 뭔가요?"
    │
    ▼
1. 하이브리드 검색으로 관련 Wiki 문서 찾기
   → standards/dg320-error-guide.md 발견
    │
    ▼
2. 스킬 매칭으로 시스템 프롬프트 강화
    │
    ▼
3. Claude API에 문서 + 질문 전달
    │
    ▼
4. 답변을 토큰 단위로 SSE 스트리밍

event: token  {"text": "DG320은 "}
event: token  {"text": "열연 공정에서 "}
event: token  {"text": "단중이 초과될 때 발생하는 에러입니다."}
event: done   {"sources": ["standards/dg320-error-guide.md"]}
```

---

## 6. API 엔드포인트

서버 주소: `http://localhost:8000`

| 메서드 | 경로 | 설명 | 응답 방식 |
|--------|------|------|---------|
| `POST` | `/agent/run` | 시나리오 실행 | JSON (전체 완료 후) |
| `POST` | `/agent/run/stream` | 시나리오 실행 | SSE (실시간 스트리밍) |
| `POST` | `/chat` | Wiki 기반 자유 채팅 | SSE (토큰 스트리밍) |
| `GET` | `/health` | 서버·DB 상태 확인 | JSON |
| `GET` | `/docs` | API 문서 (자동 생성) | Swagger UI |

### 요청 예시

**시나리오 실행**:
```bash
curl -X POST http://localhost:8000/agent/run \
  -H "Content-Type: application/json" \
  -d '{"scenario_id": "S1", "params": {"width": 1200, "thickness": 8.5}}'
```

**SSE 스트리밍**:
```bash
curl -X POST http://localhost:8000/agent/run/stream \
  -H "Content-Type: application/json" \
  -d '{"scenario_id": "S4", "params": {"term": "단중"}}' \
  --no-buffer
```

**Wiki 채팅**:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "DG320 에러가 뭔가요?"}' \
  --no-buffer
```

**서버 상태 확인**:
```bash
curl http://localhost:8000/health
# 응답 예시:
# {
#   "status": "ok",
#   "neo4j": "mock",
#   "chromadb": "connected",
#   "hybrid_search": true,
#   "reranker": false
# }
```

---

## 7. 환경변수 가이드

`backend/.env` 파일에서 설정합니다.

```bash
# ─── AI 모델 ────────────────────────────────────────────────
# Claude API 사용 시 (권장, /chat 엔드포인트 필수)
ANTHROPIC_API_KEY=sk-ant-...

# Groq API 사용 시 (무료, 빠름)
GROQ_API_KEY=gsk_...
CLAUDE_MODEL=groq:llama-3.3-70b-versatile

# ─── 데이터베이스 ────────────────────────────────────────────
# Neo4j (그래프 DB) — 비워두면 Mock 모드로 자동 전환
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=...
USE_NEO4J_MOCK=true   # false로 변경하면 실제 Neo4j 연결 시도

# ChromaDB (벡터 DB) — 로컬 파일로 저장
CHROMA_PERSIST_DIR=.chromadb

# ─── Wiki 경로 ───────────────────────────────────────────────
WIKI_DATA_DIR=../wiki_data   # wiki_data 폴더 경로

# ─── 검색 기능 설정 (신규) ───────────────────────────────────
# BM25 + 벡터 하이브리드 검색 (권장: true)
ENABLE_HYBRID_SEARCH=true

# Cross-encoder 리랭킹 (무거운 모델 필요, 기본: false)
ENABLE_RERANKER=false
RERANKER_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2

# ─── 스킬 파일 경로 (신규) ───────────────────────────────────
# 기본값: wiki_data/_skills/ (변경 필요 없음)
# SKILLS_DIR=../wiki_data/_skills
```

### 최소 설정으로 시작하기

에이전트 실행(S1~S7)만 필요하다면 `GROQ_API_KEY`만 있으면 됩니다.
`/chat` 엔드포인트를 사용하려면 `ANTHROPIC_API_KEY`가 추가로 필요합니다.

---

## 8. 서버 실행 방법

### 사전 준비

```bash
# Python 3.11+, uv 설치 필요
pip install uv

# 의존성 설치
cd backend
uv sync
```

### 서버 시작

```bash
# 개발 서버 (코드 변경 시 자동 재시작)
uv run uvicorn main:app --reload --port 8000

# 또는 백그라운드 실행
uv run uvicorn main:app --port 8000 &
```

### 서버 종료

```bash
# 포트 8000에서 실행 중인 프로세스 종료
lsof -ti :8000 | xargs kill -9
```

### 서버 시작 시 자동으로 일어나는 일

```
서버 시작
    │
    ├── Neo4j 드라이버 초기화 시도
    │   └── 실패 시 → Mock 모드로 자동 전환 (서버는 정상 구동)
    │
    ├── wiki_data/ 폴더의 모든 .md 파일을 ChromaDB에 인덱싱
    │
    └── BM25 인메모리 인덱스 동시 구축
```

---

## 9. Mock → 실제 전환 방법

현재 Tool 함수들은 가짜(Mock) 데이터를 반환합니다. 실제 시스템과 연동하려면 해당 파일의 함수만 교체하면 됩니다. **에이전트 코드는 전혀 건드릴 필요가 없습니다.**

| 우선순위 | 파일 | 현재 상태 | 교체 대상 |
|---------|------|---------|---------|
| 1 | `tools/simulation_tools.py` | 선형 근사 계산식 | 실제 공정 시뮬레이터 Python 함수 |
| 2 | `graph/ontology_loader.py` | 하드코딩 노드/엣지 | OT DB 연동 후 실제 스키마 파싱 |
| 3 | `tools/db_tools.py` | 하드코딩 Mock 테이블 | 실제 DB 쿼리 (OT 연동 승인 후) |
| 4 | `tools/git_tools.py` | 하드코딩 커밋 로그 | 실제 Git 레포 `git log` 파싱 |

### 예시: Neo4j Mock 모드 해제

```bash
# .env 파일에서
USE_NEO4J_MOCK=false
NEO4J_URI=neo4j+s://실제주소.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=실제비밀번호
```

### 예시: Git Tool 실제 구현으로 교체

```python
# tools/git_tools.py 에서 Mock 함수를 아래로 교체
async def parse_git_log(job_id: str, date_from: str, date_to: str) -> list:
    import subprocess
    result = subprocess.run(
        ["git", "log", f"--since={date_from}", f"--until={date_to}",
         "--pretty=format:%H|%s|%an|%ai"],
        cwd="/path/to/actual/repo",
        capture_output=True, text=True
    )
    # ... 파싱 로직
```

---

## 참고 자료

| 문서 | 내용 |
|------|------|
| [`/docs`](http://localhost:8000/docs) | Swagger API 문서 (서버 실행 후 접속) |
| `wiki_data/_skills/` | 에이전트 스킬 파일 (에이전트 행동 수정 시) |
| `models/response_models.py` | 프론트엔드 RichRenderer와 1:1 대응하는 응답 타입 |
| `../OVERVIEW.md` | 프로젝트 전체 개요 |
