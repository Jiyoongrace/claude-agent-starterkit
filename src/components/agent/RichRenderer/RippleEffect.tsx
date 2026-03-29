"use client"

import { useEffect, useRef } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Props {
  title: string
  diagram: string
  timeline: { name: string; before: number; after: number }[]
}

export function RippleEffectRenderer({ title, diagram, timeline }: Props) {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renderMermaid = async () => {
      if (!mermaidRef.current) return
      const mermaid = (await import("mermaid")).default
      mermaid.initialize({ startOnLoad: false, theme: "neutral" })
      try {
        const id = `mermaid-${Date.now()}`
        const { svg } = await mermaid.render(id, diagram)
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg
        }
      } catch (e) {
        console.error("Mermaid 렌더링 오류:", e)
      }
    }
    renderMermaid()
  }, [diagram])

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-base">{title}</h3>

      {/* Mermaid 다이어그램 */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">파급 효과 다이어그램</p>
        <div ref={mermaidRef} className="flex justify-center overflow-x-auto" />
      </div>

      {/* recharts 시계열 차트 */}
      <div className="rounded-lg border p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">변경 전/후 지표 비교</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={timeline} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="before" name="변경 전" fill="#6366f1" radius={[3, 3, 0, 0]} />
            <Bar dataKey="after" name="변경 후" fill="#f97316" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
