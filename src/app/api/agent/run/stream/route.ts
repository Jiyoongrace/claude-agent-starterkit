import { NextRequest } from "next/server"
import { mockAgent } from "@/lib/mock-agents"

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000"
const USE_MOCK = process.env.USE_MOCK_AGENT === "true"

/**
 * FastAPI /agent/run/stream → Next.js SSE 프록시
 *
 * 이벤트 타입:
 *   thinking — AI 실행 시작 알림
 *   result   — 최종 분석 결과 JSON
 *   error    — 오류 발생
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { scenario_id, params } = body

  const encoder = new TextEncoder()

  function makeEvent(event: string, data: unknown) {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  const stream = new ReadableStream({
    async start(controller) {
      // FastAPI SSE 스트림 시도
      if (!USE_MOCK) {
        try {
          const upstream = await fetch(`${FASTAPI_URL}/agent/run/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scenario_id, params: params ?? {} }),
            signal: AbortSignal.timeout(60_000),
          })

          if (upstream.ok && upstream.body) {
            const reader = upstream.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              // sse-starlette는 \r\n\r\n 구분자를 사용 → \n으로 정규화
              buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n")

              // SSE 이벤트 파싱 후 그대로 전달
              const events = buffer.split("\n\n")
              buffer = events.pop() ?? ""
              for (const block of events) {
                if (block.trim()) {
                  controller.enqueue(encoder.encode(block + "\n\n"))
                }
              }
            }
            controller.close()
            return
          }
        } catch {
          // FastAPI 연결 실패 → Mock 폴백
          console.warn("[agent/run/stream] FastAPI 연결 실패 → Mock 폴백")
        }
      }

      // Mock 폴백: 800ms 딜레이 후 결과 반환
      controller.enqueue(makeEvent("thinking", { message: `시나리오 ${scenario_id} 실행 중... (Mock 모드)` }))
      await new Promise(r => setTimeout(r, 800))
      const result = await mockAgent(scenario_id, params ?? {})
      controller.enqueue(makeEvent("result", result))
      controller.close()
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
