"use client"

import { useCallback } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"

// 노드 타입별 색상: target(보라), db(파랑), service(초록), code(주황)
const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  target:  { bg: "#ede9fe", border: "#7c3aed", text: "#4c1d95" },
  db:      { bg: "#dbeafe", border: "#2563eb", text: "#1e3a8a" },
  service: { bg: "#dcfce7", border: "#16a34a", text: "#14532d" },
  code:    { bg: "#ffedd5", border: "#ea580c", text: "#7c2d12" },
}

interface GraphNode { id: string; label: string; type: string }
interface GraphEdge { source: string; target: string; label: string }

interface Props {
  title: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// 노드를 자동으로 격자 배치
function layoutNodes(nodes: GraphNode[]): Node[] {
  return nodes.map((n, i) => {
    const colors = NODE_COLORS[n.type] ?? NODE_COLORS.code
    const col = i % 3
    const row = Math.floor(i / 3)
    return {
      id: n.id,
      position: { x: col * 220, y: row * 130 },
      data: { label: n.label.replace(/\\n/g, "\n") },
      style: {
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 8,
        color: colors.text,
        fontSize: 11,
        padding: "8px 12px",
        textAlign: "center" as const,
        whiteSpace: "pre-line",
        minWidth: 120,
        fontWeight: 600,
      },
    }
  })
}

function buildEdges(edges: GraphEdge[]): Edge[] {
  return edges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    label: e.label,
    labelStyle: { fontSize: 10 },
    style: { strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed },
  }))
}

export function GraphPathRenderer({ title, nodes, edges }: Props) {
  const [rfNodes, , onNodesChange] = useNodesState(layoutNodes(nodes))
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(buildEdges(edges))

  const onConnect = useCallback(
    (params: Connection) => setRfEdges((eds) => addEdge(params, eds)),
    [setRfEdges]
  )

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-base">{title}</h3>

      {/* 범례 */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(NODE_COLORS).map(([type, colors]) => (
          <span key={type} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
            style={{ borderColor: colors.border, background: colors.bg, color: colors.text }}>
            <span className="h-2 w-2 rounded-full" style={{ background: colors.border }} />
            {type === "target" ? "대상" : type === "db" ? "DB" : type === "service" ? "서비스" : "코드"}
          </span>
        ))}
      </div>

      <div className="h-[380px] rounded-lg border overflow-hidden">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background />
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>
    </div>
  )
}
