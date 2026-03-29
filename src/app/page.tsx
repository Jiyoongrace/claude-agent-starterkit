import { redirect } from "next/navigation"

// 루트 접속 시 플랫폼으로 자동 이동
export default function RootPage() {
  redirect("/platform")
}
