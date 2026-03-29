"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

interface Props {
  title: string
  service_a: string
  service_b: string
  rows_a: Record<string, string>[]
  rows_b: Record<string, string>[]
  diff_keys: string[]
}

export function MsaDiffRenderer({ title, service_a, service_b, rows_a, rows_b, diff_keys }: Props) {
  const columns = rows_a.length > 0 ? Object.keys(rows_a[0]) : []

  // 행 인덱스와 컬럼 기준으로 불일치 여부 확인
  function isDiff(rowIdx: number, col: string): boolean {
    if (!diff_keys.includes(col)) return false
    return rows_a[rowIdx]?.[col] !== rows_b[rowIdx]?.[col]
  }

  const hasDiff = rows_a.some((_, i) => columns.some(col => isDiff(i, col)))

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">{title}</h3>

      {hasDiff && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          빨간색 셀에서 두 서비스 간 데이터 불일치가 발견되었습니다.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* 서비스 A */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5 truncate">{service_a}</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  {columns.map(col => (
                    <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows_a.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {columns.map(col => (
                      <td key={col} className={cn(
                        "px-3 py-2",
                        isDiff(i, col) && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold"
                      )}>
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 서비스 B */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5 truncate">{service_b}</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  {columns.map(col => (
                    <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows_b.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {columns.map(col => (
                      <td key={col} className={cn(
                        "px-3 py-2",
                        isDiff(i, col) && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold"
                      )}>
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
