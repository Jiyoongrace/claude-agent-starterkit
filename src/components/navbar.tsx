"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Next.js Starter Kit</span>
        </div>

        {/* 다크모드 토글 버튼: base-ui는 render prop으로 커스텀 엘리먼트 전달 */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="테마 전환"
              />
            }
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {/* 라이트 모드: Sun 표시, 다크 모드: Moon 표시 */}
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </TooltipTrigger>
          <TooltipContent>
            <p>테마 전환</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}
