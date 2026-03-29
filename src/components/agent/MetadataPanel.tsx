"use client"

import { useState, useEffect } from "react"
import matter from "gray-matter"
import { cn } from "@/lib/utils"

interface Metadata {
  비즈니스_태그: string[]
  연관_DB_테이블: string
  관련_API: string
  연관_시나리오: string[]
  담당_에이전트: string
}

const SCENARIO_IDS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"]
const AGENT_TYPES = ["시뮬레이터", "트레이서", "RAG"]

interface Props {
  content: string
  filePath: string
  onSave: (newContent: string) => void
}

export function MetadataPanel({ content, filePath, onSave }: Props) {
  const [meta, setMeta] = useState<Metadata>({
    비즈니스_태그: [],
    연관_DB_테이블: "",
    관련_API: "",
    연관_시나리오: [],
    담당_에이전트: "",
  })
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    try {
      const parsed = matter(content)
      setMeta({
        비즈니스_태그: parsed.data["비즈니스_태그"] ?? [],
        연관_DB_테이블: parsed.data["연관_DB_테이블"] ?? "",
        관련_API: parsed.data["관련_API"] ?? "",
        연관_시나리오: parsed.data["연관_시나리오"] ?? [],
        담당_에이전트: parsed.data["담당_에이전트"] ?? "",
      })
    } catch { /* 파싱 실패 시 기본값 유지 */ }
  }, [content])

  function toggleScenario(id: string) {
    setMeta(m => ({
      ...m,
      연관_시나리오: m.연관_시나리오.includes(id)
        ? m.연관_시나리오.filter(s => s !== id)
        : [...m.연관_시나리오, id],
    }))
  }

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !meta.비즈니스_태그.includes(tag)) {
      setMeta(m => ({ ...m, 비즈니스_태그: [...m.비즈니스_태그, tag] }))
    }
    setTagInput("")
  }

  function removeTag(tag: string) {
    setMeta(m => ({ ...m, 비즈니스_태그: m.비즈니스_태그.filter(t => t !== tag) }))
  }

  function handleSave() {
    const parsed = matter(content)
    const newFrontmatter = {
      ...parsed.data,
      비즈니스_태그: meta.비즈니스_태그,
      연관_DB_테이블: meta.연관_DB_테이블,
      관련_API: meta.관련_API,
      연관_시나리오: meta.연관_시나리오,
      담당_에이전트: meta.담당_에이전트,
    }
    const newContent = matter.stringify(parsed.content, newFrontmatter)
    onSave(newContent)
  }

  return (
    <div className="border-t bg-muted/30 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">메타데이터 / 태깅</p>
        <button
          onClick={handleSave}
          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          메타데이터 저장
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* 비즈니스 태그 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium">비즈니스 태그</label>
          <div className="flex flex-wrap gap-1 min-h-[28px]">
            {meta.비즈니스_태그.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-destructive">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTag()}
              className="input-field text-xs py-1 flex-1"
              placeholder="태그 입력 후 Enter"
            />
          </div>
        </div>

        {/* 연관 DB 테이블 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium">연관 DB 테이블</label>
          <input
            value={meta.연관_DB_테이블}
            onChange={e => setMeta(m => ({ ...m, 연관_DB_테이블: e.target.value }))}
            className="input-field text-xs py-1"
            placeholder="예: TB_SLAB_TARGET, TB_ERROR_LOG"
          />
        </div>

        {/* 관련 API */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium">관련 API</label>
          <input
            value={meta.관련_API}
            onChange={e => setMeta(m => ({ ...m, 관련_API: e.target.value }))}
            className="input-field text-xs py-1"
            placeholder="예: GET /api/errors/DG320"
          />
        </div>

        {/* 담당 에이전트 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium">담당 에이전트</label>
          <select
            value={meta.담당_에이전트}
            onChange={e => setMeta(m => ({ ...m, 담당_에이전트: e.target.value }))}
            className="input-field text-xs py-1"
          >
            <option value="">선택...</option>
            {AGENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* 연관 시나리오 체크박스 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium">연관 시나리오</label>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_IDS.map(id => (
            <label key={id} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={meta.연관_시나리오.includes(id)}
                onChange={() => toggleScenario(id)}
                className="accent-primary"
              />
              <span className={cn(
                "text-xs rounded-full px-2 py-0.5 font-medium",
                meta.연관_시나리오.includes(id) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {id}
              </span>
            </label>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">연관 시나리오와 담당 에이전트는 추후 Graph DB 노드 연결에 활용됩니다.</p>
      </div>
    </div>
  )
}
