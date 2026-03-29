"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle, GitCommit } from "lucide-react"

interface Commit {
  hash: string
  message: string
  author: string
  date: string
  is_suspect: boolean
}

interface Props {
  title: string
  commits: Commit[]
}

export function GitTimelineRenderer({ title, commits }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">{title}</h3>

      <div className="relative">
        {/* 수직 타임라인 선 */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

        <div className="space-y-3">
          {commits.map((commit, i) => (
            <div key={i} className={cn(
              "relative flex gap-4 pl-10 pr-3 py-3 rounded-lg border transition-colors",
              commit.is_suspect
                ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                : "border-border bg-card hover:bg-muted/30"
            )}>
              {/* 타임라인 아이콘 */}
              <div className={cn(
                "absolute left-2 top-3.5 flex h-5 w-5 items-center justify-center rounded-full",
                commit.is_suspect ? "bg-red-500" : "bg-muted-foreground/20"
              )}>
                {commit.is_suspect
                  ? <AlertTriangle className="h-3 w-3 text-white" />
                  : <GitCommit className="h-3 w-3 text-muted-foreground" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className={cn(
                    "font-medium text-sm",
                    commit.is_suspect && "text-red-700 dark:text-red-400"
                  )}>
                    {commit.message}
                    {commit.is_suspect && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3" /> 의심 커밋
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{commit.date}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono bg-muted rounded px-1.5 py-0.5">{commit.hash}</span>
                  <span>{commit.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {commits.some(c => c.is_suspect) && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          빨간색으로 표시된 커밋이 비정상 종료의 원인으로 의심됩니다. 해당 커밋의 변경 사항을 검토하세요.
        </div>
      )}
    </div>
  )
}
