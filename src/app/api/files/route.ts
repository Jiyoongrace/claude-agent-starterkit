import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const WIKI_BASE = path.join(process.cwd(), "wiki_data")

// 디렉토리를 재귀적으로 트리 구조로 변환
function buildTree(dirPath: string, basePath: string): FileNode[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const nodes: FileNode[] = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const relativePath = path.relative(basePath, fullPath)

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: "directory",
        children: buildTree(fullPath, basePath),
      })
    } else if (entry.name.endsWith(".md")) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: "file",
      })
    }
  }

  return nodes.sort((a, b) => {
    // 디렉토리 먼저, 그 다음 파일
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

interface FileNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileNode[]
}

// GET /api/files — wiki_data 전체 트리 반환
export async function GET() {
  try {
    const tree = buildTree(WIKI_BASE, WIKI_BASE)
    return NextResponse.json({ tree })
  } catch {
    return NextResponse.json({ error: "파일 트리를 불러올 수 없습니다." }, { status: 500 })
  }
}
