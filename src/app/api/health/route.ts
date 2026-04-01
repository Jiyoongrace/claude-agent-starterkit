import { NextResponse } from "next/server"

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000"

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI_URL}/health`, {
      signal: AbortSignal.timeout(3_000),
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({ connected: true, ...data })
    }
  } catch {
    // 연결 실패
  }
  return NextResponse.json({ connected: false, status: "offline" })
}
