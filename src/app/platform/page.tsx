"use client"

import { useWorkspace } from "@/lib/workspace-context"
import { HomeDashboard } from "@/components/agent/HomeDashboard"
import { ScenarioPanel } from "@/components/agent/ScenarioPanel"
import { ResultPanel } from "@/components/agent/ResultPanel"
import { Workspace } from "@/components/agent/Workspace"

export default function PlatformPage() {
  const { mode } = useWorkspace()

  switch (mode.type) {
    case "home":
      return <HomeDashboard />
    case "scenario":
      return <ScenarioPanel scenarioId={mode.scenarioId} />
    case "result":
      return <ResultPanel scenarioId={mode.scenarioId} result={mode.result} />
    case "document":
      return <Workspace filePath={mode.filePath} content={mode.content} />
  }
}
