"use client"

import { SimulationTableRenderer } from "./SimulationTable"
import { RippleEffectRenderer } from "./RippleEffect"
import { GitTimelineRenderer } from "./GitTimeline"
import { GraphPathRenderer } from "./GraphPath"
import { WikiResultRenderer } from "./WikiResult"
import { MsaDiffRenderer } from "./MsaDiff"

export type AgentResponse =
  | { type: "simulation_table"; title: string; params: Record<string, string>; results: Record<string, string>[]; optimal_index: number }
  | { type: "ripple_effect"; title: string; diagram: string; timeline: { name: string; before: number; after: number }[] }
  | { type: "git_timeline"; title: string; commits: { hash: string; message: string; author: string; date: string; is_suspect: boolean }[] }
  | { type: "graph_path"; title: string; nodes: { id: string; label: string; type: string }[]; edges: { source: string; target: string; label: string }[] }
  | { type: "wiki_result"; content: string; mappings: { term: string; screen: string; db_table: string; api: string }[] }
  | { type: "msa_diff"; title: string; service_a: string; service_b: string; rows_a: Record<string, string>[]; rows_b: Record<string, string>[]; diff_keys: string[] }

export function RichRenderer({ response }: { response: AgentResponse }) {
  switch (response.type) {
    case "simulation_table": return <SimulationTableRenderer {...response} />
    case "ripple_effect":    return <RippleEffectRenderer {...response} />
    case "git_timeline":     return <GitTimelineRenderer {...response} />
    case "graph_path":       return <GraphPathRenderer {...response} />
    case "wiki_result":      return <WikiResultRenderer {...response} />
    case "msa_diff":         return <MsaDiffRenderer {...response} />
  }
}
