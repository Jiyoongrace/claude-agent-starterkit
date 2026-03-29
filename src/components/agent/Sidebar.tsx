"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, FileText, FolderOpen, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import { SCENARIOS, AGENT_BADGE_COLORS, AgentType } from "@/lib/scenarios"
import { useWorkspace } from "@/lib/workspace-context"

interface FileNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileNode[]
}

// 에이전트 그룹별 시나리오 분류
const AGENT_GROUPS: { agent: AgentType; emoji: string; scenarios: string[] }[] = [
  { agent: "시뮬레이터", emoji: "🔮", scenarios: ["S1", "S2"] },
  { agent: "트레이서",   emoji: "🔍", scenarios: ["S3", "S5", "S7"] },
  { agent: "RAG",        emoji: "📚", scenarios: ["S4", "S6"] },
]

function FileTreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [open, setOpen] = useState(true)
  const { setMode } = useWorkspace()

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-muted/50 text-muted-foreground"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {open ? <FolderOpen className="h-3.5 w-3.5 shrink-0" /> : <Folder className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate font-medium">{node.name}</span>
          {open ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRight className="h-3 w-3 ml-auto" />}
        </button>
        {open && node.children?.map((child) => (
          <FileTreeNode key={child.path} node={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  return (
    <button
      onClick={async () => {
        const res = await fetch(`/api/files/${node.path}`)
        const { content } = await res.json()
        setMode({ type: "document", filePath: node.path, content })
      }}
      className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-muted/50 text-foreground"
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{node.name.replace(".md", "")}</span>
    </button>
  )
}

export function Sidebar() {
  const { mode, setMode } = useWorkspace()
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [wikiOpen, setWikiOpen] = useState(true)

  useEffect(() => {
    fetch("/api/files")
      .then(r => r.json())
      .then(data => setFileTree(data.tree ?? []))
  }, [])

  const activeScenarioId = (mode.type === "scenario" || mode.type === "result") ? mode.scenarioId : null

  return (
    <aside className="flex h-full flex-col overflow-hidden border-r bg-sidebar">
      <div className="shrink-0 border-b px-3 py-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">에이전트 네비게이터</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 섹션 A — 시나리오 런처 */}
        <div className="py-2">
          {AGENT_GROUPS.map((group) => (
            <div key={group.agent} className="mb-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5">
                <span className="text-sm">{group.emoji}</span>
                <span className="text-xs font-semibold text-muted-foreground">{group.agent}</span>
              </div>
              {SCENARIOS.filter(s => group.scenarios.includes(s.id)).map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setMode({ type: "scenario", scenarioId: scenario.id })}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md mx-2 px-2 py-2 text-left text-xs transition-colors",
                    activeScenarioId === scenario.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                  style={{ width: "calc(100% - 16px)" }}
                >
                  <span className="shrink-0 font-mono text-[10px] font-bold text-muted-foreground mt-0.5">
                    [{scenario.id}]
                  </span>
                  <span className="flex-1 leading-tight">{scenario.title}</span>
                  <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium", AGENT_BADGE_COLORS[scenario.agent])}>
                    {scenario.agent}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* 섹션 B — Wiki 파일 트리 */}
        <div className="border-t">
          <button
            onClick={() => setWikiOpen(!wikiOpen)}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Wiki 파일 트리</span>
            <span className="ml-auto">{wikiOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</span>
          </button>
          {wikiOpen && (
            <div className="pb-2">
              {fileTree.map(node => (
                <FileTreeNode key={node.path} node={node} />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
