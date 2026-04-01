"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, X, Bot, User, BookOpen, MessageSquare, FileText } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { SCENARIOS } from "@/lib/scenarios"
import { useWorkspace } from "@/lib/workspace-context"
import matter from "gray-matter"

type ChatMode = "general" | "wiki"

interface SourceDoc {
  source: string
  score?: number
}

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: SourceDoc[]
  streaming?: boolean
}

const QUICK_QUESTIONS: Record<ChatMode, string[]> = {
  general: ["DG320 에러 원인은?", "Edging 기준 변경 영향?", "단중 뜻이 뭐야?"],
  wiki: ["DG320 에러코드 설명해줘", "단중(Unit Weight) 정의가 뭐야?", "IRMS 권한 신청 절차는?"],
}

export function CopilotPanel() {
  const { mode, setCopilotOpen } = useWorkspace()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>("wiki")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 현재 컨텍스트 정보 추출
  const contextInfo = (() => {
    if (mode.type === "scenario" || mode.type === "result") {
      const scenario = SCENARIOS.find(s => s.id === mode.scenarioId)
      return {
        type: "scenario" as const,
        label: `${scenario?.id} ${scenario?.title}`,
        scenarioId: scenario?.id,
        data: { scenarioName: scenario?.title, agentType: scenario?.agent },
      }
    }
    if (mode.type === "document") {
      const body = (() => { try { return matter(mode.content).content } catch { return mode.content } })()
      return {
        type: "document" as const,
        label: mode.filePath,
        data: { content: body },
      }
    }
    return null
  })()

  // Wiki RAG SSE 스트리밍
  async function sendWikiMessage(text: string) {
    const userMsg: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    // 스트리밍 중인 빈 메시지 추가
    const assistantIdx = (prev: Message[]) => prev.length
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }])

    try {
      const res = await fetch("/api/chat/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          scenario_id: contextInfo?.type === "scenario" ? contextInfo.scenarioId : null,
          n_context_docs: 3,
        }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: "assistant", content: "Wiki RAG 서버에 연결할 수 없습니다. FastAPI 서버를 확인하세요." }
          return next
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let accumulated = ""

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

            if (event === "token") {
              accumulated += data.token ?? ""
              setMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = { role: "assistant", content: accumulated, streaming: true }
                return next
              })
            } else if (event === "done") {
              const sources: SourceDoc[] = (data.sources ?? []).map((s: string | {source: string; score?: number}) =>
                typeof s === "string" ? { source: s } : s
              )
              setMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = { role: "assistant", content: accumulated, sources, streaming: false }
                return next
              })
            } else if (event === "error") {
              setMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = { role: "assistant", content: `오류: ${data.detail ?? "알 수 없는 오류"}` }
                return next
              })
            }
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } catch {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: "assistant", content: "서버 연결 오류가 발생했습니다." }
        return next
      })
    } finally {
      setLoading(false)
      // streaming 플래그 정리
      setMessages(prev => {
        const next = [...prev]
        if (next.length > 0 && next[next.length - 1].streaming) {
          next[next.length - 1] = { ...next[next.length - 1], streaming: false }
        }
        return next
      })
    }
  }

  // 일반 채팅 (기존 /api/chat)
  async function sendGeneralMessage(text: string) {
    const userMsg: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          contextType: contextInfo?.type ?? null,
          contextData: contextInfo?.data ?? null,
        }),
      })
      const { content } = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." }])
    } finally {
      setLoading(false)
    }
  }

  function sendMessage(text: string) {
    if (!text.trim() || loading) return
    if (chatMode === "wiki") {
      sendWikiMessage(text)
    } else {
      sendGeneralMessage(text)
    }
  }

  return (
    <aside className="flex h-full flex-col border-l bg-sidebar">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">AI 코파일럿</span>
        </div>
        <button onClick={() => setCopilotOpen(false)} className="rounded-md p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 모드 토글 */}
      <div className="shrink-0 border-b px-4 py-2.5">
        <div className="flex rounded-lg bg-muted p-0.5 gap-0.5">
          <button
            onClick={() => { setChatMode("wiki"); setMessages([]) }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              chatMode === "wiki"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="h-3 w-3" />
            Wiki RAG
          </button>
          <button
            onClick={() => { setChatMode("general"); setMessages([]) }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              chatMode === "general"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3 w-3" />
            일반 채팅
          </button>
        </div>
        {chatMode === "wiki" && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            BM25 + 벡터 하이브리드 검색으로 Wiki 문서 기반 답변
          </p>
        )}
      </div>

      {/* 현재 컨텍스트 배지 */}
      {contextInfo && (
        <div className="shrink-0 border-b px-4 py-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">컨텍스트:</span>
            <span className={cn(
              "rounded-full px-2 py-0.5 font-medium truncate max-w-[180px]",
              contextInfo.type === "scenario"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            )}>
              {contextInfo.label}
            </span>
          </div>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
            {chatMode === "wiki" ? (
              <>
                <p className="text-sm font-medium">Wiki RAG 코파일럿</p>
                <p className="text-xs mt-1 opacity-70">현장 Wiki 문서를 검색해 답변드립니다</p>
              </>
            ) : (
              <p className="text-sm">제조 현장 관련 질문을 입력하세요.</p>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2", msg.role === "user" && "flex-row-reverse")}>
            <div className={cn(
              "h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs",
              msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className="max-w-[85%] space-y-1.5">
              <div className={cn(
                "rounded-xl px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted rounded-tl-sm"
              )}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-xs dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-3.5 bg-foreground/70 animate-pulse ml-0.5 rounded-sm" />
                    )}
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>

              {/* 출처 문서 */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="pl-1 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    출처 문서
                  </p>
                  {msg.sources.map((src, si) => (
                    <div key={si} className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                      <span className="truncate">{src.source.split("/").pop()?.replace(".md", "")}</span>
                      {src.score !== undefined && (
                        <span className="shrink-0 text-primary/70 font-mono">
                          {src.score.toFixed(3)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2">
            <div className="h-7 w-7 shrink-0 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 빠른 질문 칩 */}
      <div className="shrink-0 border-t px-4 pt-3 pb-2">
        <p className="text-[10px] font-medium text-muted-foreground mb-2">빠른 질문</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS[chatMode].map(q => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 입력창 */}
      <div className="shrink-0 border-t px-4 py-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder={chatMode === "wiki" ? "Wiki에서 검색할 내용..." : "질문을 입력하세요..."}
            className="input-field flex-1 text-sm py-2"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  )
}
