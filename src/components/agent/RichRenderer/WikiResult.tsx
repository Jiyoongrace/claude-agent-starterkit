"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Mapping {
  term: string
  screen: string
  db_table: string
  api: string
}

interface Props {
  content: string
  mappings: Mapping[]
}

export function WikiResultRenderer({ content, mappings }: Props) {
  return (
    <div className="space-y-4">
      {/* 마크다운 렌더링 */}
      <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-card p-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>

      {/* 매핑 테이블 (화면 ↔ DB ↔ 비즈니스 용어) */}
      {mappings.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">화면 ↔ DB ↔ API 매핑</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">비즈니스 용어</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">화면</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">DB 테이블</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">API</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{m.term}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.screen}</td>
                    <td className="px-4 py-2 font-mono text-xs bg-muted/30 rounded">{m.db_table}</td>
                    <td className="px-4 py-2 font-mono text-xs text-blue-600 dark:text-blue-400">{m.api}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
