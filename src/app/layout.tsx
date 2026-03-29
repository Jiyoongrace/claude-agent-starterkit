import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js v15 Starter Kit",
  description:
    "Next.js v15, TailwindCSS v4, shadcn/ui로 구성된 웹 개발 스타터킷",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes가 class 속성을 동적으로 변경하므로 필수
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* TooltipProvider를 최상위에 배치하여 모든 컴포넌트에서 Tooltip 사용 가능 */}
          <TooltipProvider>
            <Navbar />
            <main>{children}</main>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
