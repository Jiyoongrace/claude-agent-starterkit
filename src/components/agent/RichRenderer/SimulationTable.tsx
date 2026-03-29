"use client"

import { cn } from "@/lib/utils"

interface Props {
  title: string
  params: Record<string, string>
  results: Record<string, string>[]
  optimal_index: number
}

export function SimulationTableRenderer({ title, params, results, optimal_index }: Props) {
  const columns = results.length > 0 ? Object.keys(results[0]) : []

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">{title}</h3>

      {/* 입력 파라미터 요약 */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(params).map(([key, value]) => (
          <span key={key} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium">
            <span className="text-muted-foreground">{key}:</span>
            <span>{value}</span>
          </span>
        ))}
      </div>

      {/* 결과 테이블 */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b last:border-0 transition-colors",
                  i === optimal_index
                    ? "bg-green-50 dark:bg-green-950/20 font-medium"
                    : "hover:bg-muted/30"
                )}
              >
                {columns.map((col) => (
                  <td key={col} className={cn("px-4 py-2", i === optimal_index && col === columns[columns.length - 1] && "text-green-600 dark:text-green-400 font-semibold")}>
                    {row[col]}
                  </td>
                ))}
                {i === optimal_index && (
                  <td className="px-4 py-2 text-xs text-green-600 dark:text-green-400 whitespace-nowrap">← 최적값</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        * 초록색 행이 DG320 위험도가 가장 낮은 최적 파라미터 조합입니다.
      </p>
    </div>
  )
}
