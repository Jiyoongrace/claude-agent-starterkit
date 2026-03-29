import { NextRequest, NextResponse } from "next/server"
import { mockAgent } from "@/lib/mock-agents"

export async function POST(req: NextRequest) {
  const { scenario_id, params } = await req.json()
  // scenario_id: "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7"
  const result = await mockAgent(scenario_id, params ?? {})
  return NextResponse.json(result)
}
