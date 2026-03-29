import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GitBranch,
  ExternalLink,
  Zap,
  Shield,
  Palette,
  Code2,
  FileCode,
  Layers,
} from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Hero 섹션 */}
      <section className="text-center space-y-6">
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-sm px-4 py-1">
            Next.js v15 · TailwindCSS v4 · shadcn/ui
          </Badge>
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
          Starter Kit
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          프로덕션 레디 웹 개발 스타터킷. App Router, TypeScript, TailwindCSS
          v4, shadcn/ui가 공식 문서 최신 가이드에 맞게 통합되어 있습니다.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg">
            <Zap className="mr-2 h-4 w-4" />
            시작하기
          </Button>
          <Button variant="outline" size="lg">
            <GitBranch className="mr-2 h-4 w-4" />
            GitHub
          </Button>
        </div>
      </section>

      <Separator />

      {/* 기술 스택 카드 */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">기술 스택</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-500 mb-2" />
              <CardTitle>Next.js v15</CardTitle>
              <CardDescription>App Router + Turbopack</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                React Server Components와 Turbopack으로 빠른 개발 경험 제공
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Badge>App Router</Badge>
              <Badge variant="secondary">RSC</Badge>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Palette className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>TailwindCSS v4</CardTitle>
              <CardDescription>CSS-first configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                config 파일 없이 CSS에서 직접 설정하는 새로운 방식
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Badge variant="secondary">No Config</Badge>
              <Badge variant="outline">@import</Badge>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Layers className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>shadcn/ui</CardTitle>
              <CardDescription>Beautiful components</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                복사-붙여넣기 방식의 접근 가능하고 커스터마이즈 가능한 UI
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Badge variant="outline">New York</Badge>
              <Badge variant="secondary">Radix UI</Badge>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Shield className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>TypeScript</CardTitle>
              <CardDescription>Type-safe development</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                타입 안전성으로 버그를 사전에 방지하고 개발 생산성 향상
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Badge>Strict Mode</Badge>
              <Badge variant="secondary">v5</Badge>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Button 변형 쇼케이스 */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Button 컴포넌트</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button disabled>Disabled</Button>
            </div>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Tooltip>
                <TooltipTrigger
                  render={<Button size="icon" variant="outline" />}
                >
                  <ExternalLink className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>외부 링크 열기</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Badge 변형 쇼케이스 */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Badge 컴포넌트</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 items-center">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge>
                <Code2 className="mr-1 h-3 w-3" />
                With Icon
              </Badge>
              <Badge>
                <FileCode className="mr-1 h-3 w-3" />
                v15.5.14
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Form 요소 쇼케이스 */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Form 컴포넌트</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* 로그인 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>로그인</CardTitle>
              <CardDescription>계정 정보를 입력하여 로그인하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">로그인</Button>
            </CardFooter>
          </Card>

          {/* 회원가입 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>회원가입</CardTitle>
              <CardDescription>새로운 계정을 만들어보세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input id="name" type="text" placeholder="홍길동" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">이메일</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="name@example.com"
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1">
                취소
              </Button>
              <Button className="flex-1">가입하기</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
