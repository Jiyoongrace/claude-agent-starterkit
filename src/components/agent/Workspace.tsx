"use client"

import { useState } from "react"
import { Edit2, Eye, Save, X, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import matter from "gray-matter"
import { useWorkspace } from "@/lib/workspace-context"
import { MetadataPanel } from "./MetadataPanel"

// react-md-editor는 SSR 비활성화 (window 객체 의존)
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface Props {
  filePath: string
  content: string
}

export function Workspace({ filePath, content: initialContent }: Props) {
  const { setMode } = useWorkspace()
  const { resolvedTheme } = useTheme()
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [draftContent, setDraftContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)

  // YAML 프론트매터 제거 후 본문만 렌더링
  const bodyContent = (() => {
    try { return matter(content).content } catch { return content }
  })()

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/files/${filePath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draftContent }),
      })
      setContent(draftContent)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraftContent(content)
    setEditing(false)
  }

  async function handleMetadataSave(newContent: string) {
    setSaving(true)
    try {
      await fetch(`/api/files/${filePath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      })
      setContent(newContent)
      setDraftContent(newContent)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">wiki_data /</p>
          <p className="text-sm font-medium">{filePath}</p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                저장
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
                취소
              </button>
            </>
          ) : (
            <button
              onClick={() => { setDraftContent(content); setEditing(true) }}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <Edit2 className="h-3.5 w-3.5" />
              수정
            </button>
          )}
        </div>
      </div>

      {/* 본문 영역 */}
      <div className="flex-1 overflow-y-auto">
        {editing ? (
          <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"} className="h-full">
            <MDEditor
              value={draftContent}
              onChange={val => setDraftContent(val ?? "")}
              height="100%"
              preview="live"
            />
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none px-6 py-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyContent}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* 메타데이터 패널 */}
      {!editing && (
        <MetadataPanel content={content} filePath={filePath} onSave={handleMetadataSave} />
      )}
    </div>
  )
}
