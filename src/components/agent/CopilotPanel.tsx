"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, X, Bot, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { SCENARIOS, AGENT_BADGE_COLORS } from "@/lib/scenarios"
import { useWorkspace } from "@/lib/workspace-context"
import matter from "gray-matter"

interface Message {
  role: "user" | "assistant"
  content: string
}

const QUICK_QUESTIONS = [
  "DG320 원인은?",
  "Edging 기준 변경 영향?",
  "단중 뜻이 뭐야?",
]

export function CopilotPanel() {
  const { mode, setCopilotOpen } = useWorkspace()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
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

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
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

      {/* 현재 컨텍스트 배지 */}
      {contextInfo && (
        <div className="shrink-0 border-b px-4 py-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">현재 컨텍스트:</span>
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
            <p className="text-sm">제조 현장 관련 질문을 입력하세요.</p>
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
            <div className={cn(
              "max-w-[85%] rounded-xl px-3 py-2 text-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted rounded-tl-sm"
            )}>
              {msg.role === "assistant" ? (
                <div className="prose prose-xs dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
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
          {QUICK_QUESTIONS.map(q => (
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
            placeholder="질문을 입력하세요..."
            className="input-field flex-1 text-sm py-2"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
