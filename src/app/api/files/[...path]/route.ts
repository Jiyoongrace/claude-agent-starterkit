import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const WIKI_BASE = path.join(process.cwd(), "wiki_data")

// 경로 순회(path traversal) 공격 방지
function safePath(segments: string[]): string | null {
  const joined = path.join(WIKI_BASE, ...segments)
  if (!joined.startsWith(WIKI_BASE)) return null
  return joined
}

// GET /api/files/[...path] — 특정 파일 내용 반환
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const filePath = safePath(segments)

  if (!filePath) {
    return NextResponse.json({ error: "잘못된 경로입니다." }, { status: 400 })
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8")
    return NextResponse.json({ content })
  } catch {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 })
  }
}

// POST /api/files/[...path] — 특정 파일 저장 (덮어쓰기)
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const filePath = safePath(segments)

  if (!filePath) {
    return NextResponse.json({ error: "잘못된 경로입니다." }, { status: 400 })
  }

  try {
    const { content } = await req.json()
    // 디렉토리가 없으면 생성
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content, "utf-8")
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "파일 저장에 실패했습니다." }, { status: 500 })
  }
}
