"""
제조 현장 AI 에이전트 백본 시스템 — FastAPI 진입점

실행:
    cd backend
    uv run uvicorn main:app --reload --port 8000

포트:
    8000 — FastAPI 백엔드 (이 파일)
    3000 — Next.js 프론트엔드

엔드포인트:
    POST /agent/run         — 시나리오 실행 (동기 응답)
    POST /agent/run/stream  — 시나리오 실행 (SSE 스트리밍)
    POST /chat              — Wiki 컨텍스트 기반 채팅 (SSE 스트리밍)
    GET  /health            — 서버 상태 확인
"""
# .env 로드를 가장 먼저 실행 — 에이전트 임포트 전에 환경변수가 세팅되어야 함
from dotenv import load_dotenv
load_dotenv()

import json
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from models.request_models import AgentRunRequest, ChatRequest
from agents.orchestrator import run_scenario
from graph.neo4j_client import init_driver, close_driver, get_driver
from vector.wiki_indexer import index_all_wiki


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ─── 시작 ────────────────────────────────────────────────────────────────
    # Neo4j 연결 시도 (실패해도 앱 정상 구동)
    await init_driver()

    # wiki_data/ → ChromaDB 인덱싱
    count = index_all_wiki()
    if count > 0:
        print(f"[Wiki] {count}개 문서 인덱싱 완료")

    yield

    # ─── 종료 ────────────────────────────────────────────────────────────────
    await close_driver()


app = FastAPI(
    title="제조 현장 AI 에이전트 API",
    description="철강/열연 공장 인텔리전스 플랫폼 — PydanticAI 에이전트 백엔드",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/agent/run")
async def agent_run(request: AgentRunRequest):
    """
    시나리오를 실행하고 RichRenderer가 소비할 구조화된 결과를 반환합니다.

    - S1, S2: 시뮬레이터 에이전트
    - S3, S5, S7: 트레이서 에이전트
    - S4, S6: RAG 에이전트
    """
    try:
        result = await run_scenario(request)
        # Pydantic 모델 → dict 직렬화 (한국어 키 포함)
        if hasattr(result, "model_dump"):
            return result.model_dump()
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"에이전트 실행 오류: {str(e)}")


@app.post("/agent/run/stream")
async def agent_run_stream(request: AgentRunRequest):
    """
    시나리오 실행 결과를 SSE로 실시간 스트리밍합니다.

    이벤트 타입:
      thinking — 실행 시작 알림 ({"message": str})
      result   — 최종 결과 JSON
      error    — 오류 발생 ({"detail": str})
    """
    async def event_generator():
        try:
            yield {
                "event": "thinking",
                "data": json.dumps(
                    {"message": f"시나리오 {request.scenario_id} 실행 중..."},
                    ensure_ascii=False,
                ),
            }
            result = await run_scenario(request)
            data = result.model_dump() if hasattr(result, "model_dump") else result
            yield {
                "event": "result",
                "data": json.dumps(data, ensure_ascii=False),
            }
        except ValueError as e:
            yield {
                "event": "error",
                "data": json.dumps({"detail": str(e)}, ensure_ascii=False),
            }
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps(
                    {"detail": f"에이전트 실행 오류: {str(e)}"},
                    ensure_ascii=False,
                ),
            }

    return EventSourceResponse(event_generator())


@app.post("/chat")
async def wiki_chat(request: ChatRequest):
    """
    Wiki 문서를 컨텍스트로 활용한 Claude API 직접 채팅 (SSE 스트리밍).

    처리 순서:
      1. 하이브리드 검색으로 관련 Wiki 문서 추출
      2. 리랭킹 (ENABLE_RERANKER=true 시)
      3. 스킬 매칭으로 시스템 프롬프트 강화
      4. Claude API streaming 호출
      5. SSE token 이벤트로 스트리밍

    이벤트 타입:
      token — 텍스트 토큰 ({"text": str})
      done  — 완료 ({"sources": list[str]})
      error — 오류 ({"detail": str})
    """
    async def event_generator():
        # 1. Wiki 컨텍스트 검색
        use_hybrid = os.getenv("ENABLE_HYBRID_SEARCH", "false").lower() == "true"
        try:
            if use_hybrid:
                from vector.hybrid_search import hybrid_search
                docs = hybrid_search(request.message, n_results=request.n_context_docs * 2)
            else:
                from vector.wiki_indexer import search_wiki
                docs = search_wiki(request.message, n_results=request.n_context_docs)

            if docs and os.getenv("ENABLE_RERANKER", "false").lower() == "true":
                from vector.reranker import rerank
                docs = rerank(request.message, docs, top_k=request.n_context_docs)
            else:
                docs = docs[:request.n_context_docs]
        except Exception:
            docs = []

        # 2. 컨텍스트 조립
        if docs:
            context_text = "\n\n---\n\n".join(
                f"[출처: {d['metadata'].get('source', 'unknown')}]\n{d['content']}"
                for d in docs
            )
        else:
            context_text = "관련 Wiki 문서를 찾을 수 없습니다."

        # 3. 스킬 매칭으로 시스템 프롬프트 강화
        skill_content = None
        try:
            from skills.matcher import match_skill
            skill_content = match_skill(request.message, request.scenario_id)
        except Exception:
            pass

        base_system = (
            "당신은 제조 현장 AI 어시스턴트입니다.\n"
            "아래 Wiki 문서를 참고하여 사용자 질문에 답변하세요.\n"
            "문서에 없는 내용은 '문서에서 확인되지 않습니다'로 답변하세요.\n"
            "한국어로 답변하세요."
        )
        system_prompt = (
            f"{skill_content}\n\n{base_system}" if skill_content else base_system
        )
        system_prompt += f"\n\n## 참고 Wiki 문서\n\n{context_text}"

        # 4. Groq API 스트리밍 호출
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            yield {
                "event": "error",
                "data": json.dumps(
                    {"detail": "GROQ_API_KEY가 설정되지 않았습니다. backend/.env를 확인하세요."},
                    ensure_ascii=False,
                ),
            }
            return

        try:
            from groq import Groq
            client = Groq(api_key=api_key)
            chat_model = os.getenv("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile")
            messages = [{"role": "system", "content": system_prompt}]
            messages += request.history
            messages.append({"role": "user", "content": request.message})

            stream = client.chat.completions.create(
                model=chat_model,
                messages=messages,
                max_tokens=2048,
                stream=True,
            )
            for chunk in stream:
                text = chunk.choices[0].delta.content or ""
                if text:
                    yield {
                        "event": "token",
                        "data": json.dumps({"token": text}, ensure_ascii=False),
                    }

            yield {
                "event": "done",
                "data": json.dumps(
                    {"sources": [d["metadata"].get("source", "") for d in docs]},
                    ensure_ascii=False,
                ),
            }
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"detail": str(e)}, ensure_ascii=False),
            }

    return EventSourceResponse(event_generator())


@app.get("/health")
async def health():
    """서버 상태 및 연결된 인프라 확인."""
    from vector.chroma_client import get_collection
    use_hybrid = os.getenv("ENABLE_HYBRID_SEARCH", "false").lower() == "true"
    enable_reranker = os.getenv("ENABLE_RERANKER", "false").lower() == "true"
    agent_model = os.getenv("CLAUDE_MODEL", "anthropic:claude-sonnet-4-20250514")
    chat_model = os.getenv("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile")
    return {
        "status": "ok",
        "neo4j": "connected" if get_driver() else "mock",
        "chromadb": "connected" if get_collection() else "unavailable",
        "hybrid_search": use_hybrid,
        "reranker": enable_reranker,
        "agent_model": agent_model,
        "chat_model": chat_model,
    }
