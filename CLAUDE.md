# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

```bash
npm run dev        # Turbopack 개발 서버
npm run build      # Turbopack 프로덕션 빌드
npm run start      # 프로덕션 서버 실행
npm run lint       # ESLint 실행
```

테스트 프레임워크는 설정되어 있지 않음.

## 기술 스택

- **Next.js 15** (App Router, Turbopack)
- **React 19**, **TypeScript 5** (strict mode, path alias `@/*` → `./src/*`)
- **TailwindCSS v4** — `tailwind.config.js` 없음, CSS-first 방식 (`src/app/globals.css`에서 설정)
- **shadcn/ui** (`base-nova` 스타일) + **@base-ui/react** (headless primitives)
- **next-themes** — 다크모드

## 시스템 개요

철강/열연 공장을 위한 **AI 에이전트 백본 플랫폼** (`/platform` 경로).
3종류 에이전트(시뮬레이터·트레이서·RAG)를 오케스트레이션하는 UI.

## 아키텍처

### 라우팅 구조

```
/ → redirect → /platform
/platform         → src/app/platform/ (3단 에이전트 레이아웃)
/api/agent/run    → POST: 시나리오 실행 (mock-agents.ts 호출)
/api/chat         → POST: Claude API 코파일럿 채팅
/api/files        → GET: wiki_data/ 파일 트리
/api/files/[...path] → GET/POST: 파일 읽기·쓰기
```

### 상태 관리

`WorkspaceContext` (`src/lib/workspace-context.tsx`)가 전체 UI 상태를 관리:
- `mode`: 4가지 워크스페이스 모드 (home / scenario / result / document)
- `copilotOpen`: 우측 코파일럿 패널 열림 여부
- `setMode()`로 사이드바·버튼 등 모든 네비게이션 처리

### 3단 레이아웃 (`src/app/platform/layout.tsx`)

```
┌──────────────────┬──────────────────────────┬──────────────┐
│ Sidebar (w-60)   │ main (flex-1)            │ CopilotPanel │
│ 시나리오 런처    │ mode에 따라 컴포넌트 교체 │ (w-80, 조건부)│
│ + 파일 트리      │                          │              │
└──────────────────┴──────────────────────────┴──────────────┘
```

중앙 패널은 `platform/page.tsx`에서 `mode` 값에 따라 컴포넌트를 switch:
- `home` → `HomeDashboard`
- `scenario` → `ScenarioPanel`
- `result` → `ResultPanel` + `RichRenderer`
- `document` → `Workspace` (마크다운 뷰어/에디터 + MetadataPanel)

### RichRenderer (`src/components/agent/RichRenderer/`)

에이전트 응답 `type`에 따라 6가지 렌더러로 분기:

| type | 렌더러 | 주요 라이브러리 |
|---|---|---|
| `simulation_table` | SimulationTable | 기본 테이블 |
| `ripple_effect` | RippleEffect | mermaid + recharts |
| `git_timeline` | GitTimeline | 커스텀 타임라인 UI |
| `graph_path` | GraphPath | reactflow |
| `wiki_result` | WikiResult | react-markdown + remark-gfm |
| `msa_diff` | MsaDiff | 좌우 비교 테이블 |

### Mock 에이전트 교체 포인트

`src/lib/mock-agents.ts`의 각 `if (scenarioId === "SN")` 블록이
추후 실제 에이전트(PydanticAI Tool, Neo4j 쿼리, Git 파싱)로 1:1 교체됩니다.

### Wiki 파일 시스템

`wiki_data/` (프로젝트 루트) — YAML 프론트매터 포함 마크다운 파일.
`연관_시나리오`와 `담당_에이전트` 필드가 추후 Graph DB 노드 연결에 활용됩니다.
`MetadataPanel`에서 편집 후 `gray-matter`로 프론트매터를 읽고 씁니다.

### 컴포넌트 레이어

1. `src/components/ui/` — shadcn/ui 기반 컴포넌트 (copy-paste 방식)
2. `cn()` (`src/lib/utils.ts`) — `clsx` + `tailwind-merge`
3. `SCENARIOS` 상수 (`src/lib/scenarios.ts`) — 7개 시나리오 메타데이터 단일 소스

### 스타일링 규칙

- TailwindCSS v4 CSS-first — `tailwind.config.js` 생성 금지
- 공통 입력 스타일: `input-field` 클래스 (`globals.css`에 정의)
- 다크모드: `.dark:` 변형 사용
- `<html suppressHydrationWarning>` 필수 유지 (next-themes)
- 인터랙티브 컴포넌트는 반드시 `"use client"` 선언

### 추가 설치된 패키지

```
@uiw/react-md-editor  — 마크다운 에디터 (SSR 비활성화 필요: dynamic import)
react-markdown        — 마크다운 렌더링
remark-gfm           — GFM 확장
mermaid              — 다이어그램 (dynamic import, 클라이언트 전용)
reactflow            — 온톨로지 그래프 시각화
recharts             — 시계열 차트
gray-matter          — YAML 프론트매터 파싱
@anthropic-ai/sdk    — Claude API (api/chat/route.ts에서 사용)
```
