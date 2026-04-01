import { NextRequest } from "next/server"

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000"

/**
 * FastAPI /chat → Next.js SSE 프록시
 * Wiki RAG 기반 채팅 (하이브리드 검색 + Claude API)
 *
 * 이벤트 타입:
 *   token — 텍스트 토큰 스트림
 *   done  — 완료 (출처 문서 목록 포함)
 *   error — 오류
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { message, history, scenario_id, n_context_docs } = body

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const upstream = await fetch(`${FASTAPI_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            history: history ?? [],
            scenario_id: scenario_id ?? null,
            n_context_docs: n_context_docs ?? 3,
          }),
          signal: AbortSignal.timeout(60_000),
        })

        if (!upstream.ok || !upstream.body) {
          const err = { detail: "FastAPI /chat 연결 실패 — ANTHROPIC_API_KEY를 확인하세요." }
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(err)}\n\n`))
          controller.close()
          return
        }

        const reader = upstream.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          // sse-starlette는 \r\n\r\n 구분자를 사용 → \n으로 정규화
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n")

          const events = buffer.split("\n\n")
          buffer = events.pop() ?? ""
          for (const block of events) {
            if (block.trim()) {
              controller.enqueue(encoder.encode(block + "\n\n"))
            }
          }
        }
        controller.close()
      } catch (e) {
        const msg = e instanceof Error ? e.message : "알 수 없는 오류"
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ detail: msg })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
