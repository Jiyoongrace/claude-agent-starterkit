import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { message, contextType, contextData } = await req.json()

  // 컨텍스트 타입에 따른 시스템 프롬프트 구성
  let systemPrompt = "당신은 제조 현장 인텔리전스 플랫폼의 AI 코파일럿입니다. 철강/열연 공장 운영에 대한 전문적인 도움을 제공합니다."

  if (contextType === "scenario" && contextData) {
    systemPrompt = `현재 사용자는 [${contextData.scenarioName}] 분석을 수행 중입니다. 에이전트 타입은 [${contextData.agentType}]입니다. 관련 질문에 답변하세요.`
  } else if (contextType === "document" && contextData) {
    systemPrompt = `현재 사용자가 보고 있는 위키 문서:\n\n${contextData.content}`
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return NextResponse.json({ content: text })
}
