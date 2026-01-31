import type { EvaluationResult } from './evaluation'

// Generate improved UI code based on evaluation result
export async function generateImprovedUI(
  originalImageUrl: string | null,
  evaluationResult: EvaluationResult
): Promise<{ html: string; css: string; description: string }> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY

  // Build improvement suggestions from evaluation
  const improvements = evaluationResult.categories
    .flatMap(cat => cat.improvements || [])
    .filter(imp => imp.length > 0)

  const criteriaImprovements = evaluationResult.categories
    .flatMap(cat => cat.criteria)
    .filter(c => c.score < 4.0)
    .flatMap(c => c.improvements || [])

  const allImprovements = [...improvements, ...criteriaImprovements].slice(0, 10)

  const prompt = `당신은 v0.dev와 Lovable 수준의 프로덕션급 UI를 만드는 시니어 프론트엔드 개발자입니다.

## 핵심 임무
제공된 원본 스크린샷을 분석하여, 평가 결과의 개선점을 반영한 **프로덕션 품질의 UI**를 생성하세요.

## 화면 정보
- 화면 이름: ${evaluationResult.screenName}
- 현재 점수: ${evaluationResult.overallScore}/5.0

## 적용할 개선 사항
${allImprovements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

---
## ⚠️ CRITICAL: 디자인 시스템 규칙 (v0/Lovable 방식)

### 1. 시맨틱 색상 변수 필수 사용
절대로 하드코딩된 색상 사용 금지! 반드시 CSS 변수 기반 클래스 사용:
- \`bg-background\`, \`text-foreground\` (기본 배경/텍스트)
- \`bg-card\`, \`text-card-foreground\` (카드 컴포넌트)
- \`bg-primary\`, \`text-primary-foreground\` (주요 액션 버튼)
- \`bg-secondary\`, \`text-secondary-foreground\` (보조 버튼)
- \`bg-muted\`, \`text-muted-foreground\` (비활성/보조 텍스트)
- \`bg-accent\`, \`text-accent-foreground\` (강조 영역)
- \`bg-destructive\`, \`text-destructive\` (삭제/위험 액션)
- \`border-border\`, \`border-input\` (테두리)
- \`ring-ring\` (포커스 링)

❌ 금지: \`bg-white\`, \`text-gray-500\`, \`bg-blue-600\`, \`text-black\`
✅ 권장: \`bg-background\`, \`text-muted-foreground\`, \`bg-primary\`, \`text-foreground\`

### 2. 모바일 우선 반응형 디자인
- 기본: 모바일 레이아웃
- \`sm:\` (640px+), \`md:\` (768px+), \`lg:\` (1024px+), \`xl:\` (1280px+)
- 그리드 예시: \`grid-cols-1 md:grid-cols-2 lg:grid-cols-3\`
- 플렉스 예시: \`flex-col md:flex-row\`

### 3. 접근성 (WCAG AA 준수)
- 모든 인터랙티브 요소에 \`focus:outline-none focus-visible:ring-2 focus-visible:ring-ring\`
- 버튼: \`aria-label\` 또는 명확한 텍스트
- 이미지: 의미 있는 \`alt\` 속성
- 폼 필드: \`<label>\` 연결 또는 \`aria-label\`
- 컬러 대비: 텍스트와 배경 간 4.5:1 이상

### 4. 다크모드 지원
- HTML에 \`class="dark"\` 토글 가능하도록 구조화
- 모든 색상은 시맨틱 변수 사용으로 자동 지원

### 5. shadcn/ui 컴포넌트 패턴 (프로젝트 실제 스타일)

**Button - Primary:**
\`\`\`html
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50">
  버튼 텍스트
</button>
\`\`\`

**Button - Secondary:**
\`\`\`html
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50">
  보조 버튼
</button>
\`\`\`

**Button - Outline:**
\`\`\`html
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50">
  아웃라인 버튼
</button>
\`\`\`

**Button - Destructive:**
\`\`\`html
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 bg-destructive text-white hover:bg-destructive/90 outline-none focus-visible:ring-destructive/20 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50">
  삭제
</button>
\`\`\`

**Card:**
\`\`\`html
<div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
  <div class="px-6">
    <h3 class="leading-none font-semibold">카드 제목</h3>
    <p class="text-muted-foreground text-sm mt-2">카드 설명</p>
  </div>
  <div class="px-6">
    <!-- 카드 내용 -->
  </div>
</div>
\`\`\`

**Input:**
\`\`\`html
<input type="text" class="placeholder:text-muted-foreground border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50" placeholder="입력하세요" />
\`\`\`

**Label + Input 조합:**
\`\`\`html
<div class="space-y-2">
  <label class="text-sm font-medium leading-none" for="email">이메일</label>
  <input id="email" type="email" class="placeholder:text-muted-foreground border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" placeholder="example@email.com" />
</div>
\`\`\`

**Badge:**
\`\`\`html
<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground">뱃지</span>
<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">보조</span>
\`\`\`

**Alert/Notice:**
\`\`\`html
<div class="relative w-full rounded-lg border p-4 bg-background text-foreground" role="alert">
  <h5 class="mb-1 font-medium leading-none tracking-tight">알림 제목</h5>
  <div class="text-sm text-muted-foreground">알림 내용입니다.</div>
</div>
\`\`\`

### 6. 레이아웃 원칙
- 일관된 간격: \`gap-4\`, \`gap-6\`, \`p-4\`, \`p-6\`
- 최대 너비 제한: \`max-w-7xl mx-auto\`
- 섹션 간격: \`space-y-6\` 또는 \`space-y-8\`

---
## HTML 필수 구조
\`\`\`html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            background: 'oklch(0.995 0 0)',
            foreground: 'oklch(0.145 0.015 250)',
            card: 'oklch(1 0 0)',
            'card-foreground': 'oklch(0.145 0.015 250)',
            primary: 'oklch(0.55 0.2 250)',
            'primary-foreground': 'oklch(0.985 0 0)',
            secondary: 'oklch(0.965 0.005 250)',
            'secondary-foreground': 'oklch(0.25 0.02 250)',
            muted: 'oklch(0.965 0.005 250)',
            'muted-foreground': 'oklch(0.5 0.015 250)',
            accent: 'oklch(0.965 0.005 250)',
            'accent-foreground': 'oklch(0.25 0.02 250)',
            destructive: 'oklch(0.577 0.245 27.325)',
            border: 'oklch(0.915 0.005 250)',
            input: 'oklch(0.915 0.005 250)',
            ring: 'oklch(0.55 0.2 250)',
          },
          borderRadius: {
            lg: '0.625rem',
            md: '0.5rem',
            sm: '0.375rem',
          }
        }
      }
    }
  </script>
  <title>개선된 UI</title>
</head>
<body class="bg-background text-foreground min-h-screen antialiased">
  <!-- 프로덕션 품질 UI 구현 -->
</body>
</html>
\`\`\`

---
## 응답 형식 (JSON만 출력)
{
  "description": "원본 대비 개선된 점 설명 (2-3문장, 접근성/반응형/디자인 시스템 적용 언급)",
  "html": "완전한 HTML 코드",
  "improvements_applied": ["실제 적용한 개선사항 목록"]
}

반드시 위 JSON 형식으로만 응답하세요.`

  try {
    // Prepare message content
    type MessageContent = string | Array<{ type: string; source?: { type: string; media_type: string; data: string }; text?: string }>
    let messageContent: MessageContent = prompt

    // If we have an image, include it for reference
    if (originalImageUrl) {
      try {
        const response = await fetch(originalImageUrl)
        const blob = await response.blob()
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const result = reader.result as string
            resolve(result.split(',')[1])
          }
          reader.readAsDataURL(blob)
        })

        messageContent = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: blob.type || 'image/png',
              data: base64,
            }
          },
          { type: 'text', text: prompt }
        ]
      } catch (err) {
        console.warn('Failed to load original image, continuing without it:', err)
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16384,
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Check if response was truncated
    if (data.stop_reason === 'max_tokens') {
      console.warn('Response was truncated due to max_tokens limit')
    }

    // Parse JSON response - find the outermost JSON object
    let braceCount = 0
    let jsonStart = -1
    let jsonEnd = -1

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') {
        if (braceCount === 0) jsonStart = i
        braceCount++
      } else if (content[i] === '}') {
        braceCount--
        if (braceCount === 0 && jsonStart !== -1) {
          jsonEnd = i + 1
          break
        }
      }
    }

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('Raw response:', content)
      throw new Error('No valid JSON found in response')
    }

    const jsonStr = content.slice(jsonStart, jsonEnd)

    let parsed
    try {
      parsed = JSON.parse(jsonStr)
    } catch (parseError) {
      // Try to extract HTML using regex if JSON parsing fails
      console.warn('JSON parse failed, attempting manual extraction')
      const htmlMatch = content.match(/"html"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"improvements_applied"|"\s*\})/);
      const descMatch = content.match(/"description"\s*:\s*"([^"]*)"/)

      if (htmlMatch && descMatch) {
        // Unescape the HTML content
        const html = htmlMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
        parsed = {
          html,
          description: descMatch[1]
        }
      } else {
        console.error('Failed to extract from:', jsonStr.slice(0, 500))
        throw parseError
      }
    }

    return {
      html: parsed.html,
      css: '', // CSS is embedded in HTML with Tailwind
      description: parsed.description,
    }
  } catch (error) {
    console.error('UI improvement generation error:', error)
    throw error
  }
}

// Capture HTML as image using html2canvas (optional)
export async function captureAsImage(element: HTMLElement): Promise<string> {
  // Dynamic import to avoid loading if not used
  const html2canvas = (await import('html2canvas')).default

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
  })

  return canvas.toDataURL('image/png')
}
