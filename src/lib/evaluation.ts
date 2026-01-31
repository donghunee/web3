// Evaluation criteria structure
export const evaluationCategories = [
  {
    id: 'ui-design',
    name: 'UI 디자인',
    criteria: [
      { id: 'visual-hierarchy', name: '시각적 계층', question: '정보의 중요도에 따라 시각적 계층이 명확하게 구성되어 있는가?' },
      { id: 'color-contrast', name: '색상 및 대비', question: '색상 사용이 적절하고 텍스트와 배경의 대비가 가독성을 보장하는가?' },
      { id: 'typography', name: '타이포그래피', question: '폰트 크기, 굵기, 행간이 가독성과 심미성을 고려하여 적절하게 설정되어 있는가?' },
      { id: 'spacing-layout', name: '여백 및 레이아웃', question: '요소 간 여백과 정렬이 일관되고 시각적으로 편안한가?' },
    ]
  },
  {
    id: 'convenience',
    name: '편의성',
    criteria: [
      { id: 'efficiency', name: '효율성, 편의성', question: '원하는 목적을 달성하는데 소모되는 자원의 효율이 최적화되어 있는가?' },
      { id: 'responsiveness', name: '반응성', question: '사용자의 조작에 따라 인터페이스가 활성화됨을 시각적으로 명확하게 확인할 수 있는가?' },
    ]
  },
  {
    id: 'accuracy',
    name: '정확성',
    criteria: [
      { id: 'error-recovery', name: '오류 회복성', question: '예상치 못한 오류 발생 시 사후처리, 조치에 대한 인터랙션이 적절하게 일어나는가?' },
      { id: 'error-prevention', name: '사전 방지성', question: '오류가 발생하기 직전 시스템 상에서 사용자가 실수하지 않도록 가이드를 제공하고 있는가?' },
      { id: 'learnability', name: '학습 용이성', question: '사용자가 응용법을 적절히 배울/인지할 수 있도록 서비스가 지원하고 있는가?' },
    ]
  },
  {
    id: 'meaningfulness',
    name: '의미성',
    criteria: [
      { id: 'feedback', name: '피드백', question: '시스템의 상태가 전환되었을 때 사용자가 인지할 수 있는 인터랙션을 제공하고 있는가?' },
      { id: 'intuitiveness', name: '직관성', question: '상대적인 정보의 중요도를 고려한 화면이 구성되어 있는가?' },
      { id: 'universality', name: '보편성', question: '사용자에게 시각적으로 익숙한 디자인과 화면구성을 제공하고 있는가?' },
      { id: 'logic', name: '논리성', question: '정보의 구성이나 순서가 논리적으로 제공되고 있어 이해하기 쉬운가?' },
    ]
  },
  {
    id: 'flexibility',
    name: '유연성',
    criteria: [
      { id: 'user-control', name: '사용자 주도권', question: '처음 지정된 것 이외의 작업 또는 환경의 변화에 사용자가 적절히 적응할 수 있는가?' },
      { id: 'alternatives', name: '대체성', question: '접근방식의 다양성으로 사용자의 기호에 맞게 선택할 수 있는 권한이 주어지고 있는가?' },
    ]
  },
  {
    id: 'consistency',
    name: '일관성',
    criteria: [
      { id: 'predictability', name: '예측성', question: '보편적으로 사용되는 형태로 제공되어 사용자가 충분히 예측가능한 기능이 제공되고 있는가?' },
      { id: 'regularity', name: '규칙성', question: '사용의 특정 목적, 기능 및 조건을 이해할 수 있는 서비스인가?' },
      { id: 'internal-consistency', name: '내부적 일관성', question: '해당 서비스 내 화면들이 일관된 스타일로 규칙을 가지고 있는가?' },
    ]
  },
]

export interface CriterionEvaluation {
  id: string
  name: string
  score: number
  improvements: string[]
}

export interface CategoryEvaluation {
  id: string
  name: string
  score: number
  summary: string
  improvements: string[]
  criteria: CriterionEvaluation[]
}

export interface EvaluationResult {
  screenId: string
  screenName: string
  overallScore: number
  totalStrengths: number
  totalImprovements: number
  summary: string
  categories: CategoryEvaluation[]
  createdAt: string
}

// Convert image URL to base64
async function imageUrlToBase64(url: string): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status)
      return null
    }
    const blob = await response.blob()

    // Validate blob
    if (!blob || blob.size === 0) {
      console.error('Empty blob received')
      return null
    }

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string

        // Validate result format (should be data:mimetype;base64,xxxxx)
        if (!result || typeof result !== 'string' || !result.includes(',')) {
          console.error('Invalid FileReader result')
          resolve(null)
          return
        }

        const base64 = result.split(',')[1]

        // Validate base64 string
        if (!base64 || base64.length === 0) {
          console.error('Empty base64 data')
          resolve(null)
          return
        }

        // Get media type from blob or extract from data URL
        let mediaType = blob.type
        if (!mediaType || !mediaType.startsWith('image/')) {
          // Try to extract from data URL
          const match = result.match(/^data:([^;]+);/)
          if (match && match[1].startsWith('image/')) {
            mediaType = match[1]
          } else {
            mediaType = 'image/png' // Default fallback
          }
        }

        console.log('Image converted successfully:', {
          mediaType,
          base64Length: base64.length,
          blobSize: blob.size
        })

        resolve({ base64, mediaType })
      }
      reader.onerror = () => {
        console.error('FileReader error')
        resolve(null)
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error converting image to base64:', error)
    return null
  }
}

// AI Evaluation using Claude API
export async function evaluateScreen(
  screenName: string,
  screenPurpose: string,
  userActions: string[],
  imageUrl: string | null
): Promise<EvaluationResult> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY

  const prompt = `당신은 UX 휴리스틱 평가 전문가입니다. 다음 화면에 대해 **매우 상세하고 구체적인** 사용성 평가를 수행해주세요.

## 평가 대상 화면
- 화면 이름: ${screenName}
- 화면 목적: ${screenPurpose}
- 사용자 액션: ${userActions.join(', ')}
${imageUrl ? `- 스크린샷이 제공되었습니다. 이미지를 분석하여 평가해주세요.` : '- 스크린샷이 제공되지 않았습니다. 제공된 정보만으로 평가해주세요.'}

## 중요: 상세한 설명 작성 가이드
모든 평가 내용에서 **구체적인 UI 요소와 위치를 명시**해주세요. 텍스트만 읽어도 어떤 요소인지 바로 알 수 있어야 합니다.

좋은 예시:
- "화면 상단 좌측에 위치한 파란색 로고는 브랜드 인지도를 높이는 데 효과적입니다"
- "헤더 우측 끝의 돋보기 아이콘 검색 버튼은 크기가 24px로 작아 탭하기 어려울 수 있습니다"
- "메인 영역 중앙의 '지금 시작하기' CTA 버튼은 주황색 배경에 흰색 텍스트로 시인성이 좋습니다"
- "하단 네비게이션 바의 5개 아이콘 중 '홈' 아이콘만 활성화 상태(파란색)로 표시되어 현재 위치를 명확히 알 수 있습니다"

나쁜 예시 (너무 추상적):
- "버튼이 잘 보입니다" ❌
- "레이아웃이 좋습니다" ❌
- "색상이 적절합니다" ❌

## 평가 기준 (6개 카테고리, 18개 세부 항목)

1. UI 디자인
   - 시각적 계층: 정보의 중요도에 따라 시각적 계층이 명확하게 구성되어 있는가?
   - 색상 및 대비: 색상 사용이 적절하고 텍스트와 배경의 대비가 가독성을 보장하는가?
   - 타이포그래피: 폰트 크기, 굵기, 행간이 가독성과 심미성을 고려하여 적절하게 설정되어 있는가?
   - 여백 및 레이아웃: 요소 간 여백과 정렬이 일관되고 시각적으로 편안한가?

2. 편의성
   - 효율성, 편의성: 원하는 목적을 달성하는데 소모되는 자원의 효율이 최적화되어 있는가?
   - 반응성: 사용자의 조작에 따라 인터페이스가 활성화됨을 시각적으로 명확하게 확인할 수 있는가?

3. 정확성
   - 오류 회복성: 예상치 못한 오류 발생 시 사후처리, 조치에 대한 인터랙션이 적절하게 일어나는가?
   - 사전 방지성: 오류가 발생하기 직전 시스템 상에서 사용자가 실수하지 않도록 가이드를 제공하고 있는가?
   - 학습 용이성: 사용자가 응용법을 적절히 배울/인지할 수 있도록 서비스가 지원하고 있는가?

4. 의미성
   - 피드백: 시스템의 상태가 전환되었을 때 사용자가 인지할 수 있는 인터랙션을 제공하고 있는가?
   - 직관성: 상대적인 정보의 중요도를 고려한 화면이 구성되어 있는가?
   - 보편성: 사용자에게 시각적으로 익숙한 디자인과 화면구성을 제공하고 있는가?
   - 논리성: 정보의 구성이나 순서가 논리적으로 제공되고 있어 이해하기 쉬운가?

5. 유연성
   - 사용자 주도권: 처음 지정된 것 이외의 작업 또는 환경의 변화에 사용자가 적절히 적응할 수 있는가?
   - 대체성: 접근방식의 다양성으로 사용자의 기호에 맞게 선택할 수 있는 권한이 주어지고 있는가?

6. 일관성
   - 예측성: 보편적으로 사용되는 형태로 제공되어 사용자가 충분히 예측가능한 기능이 제공되고 있는가?
   - 규칙성: 사용의 특정 목적, 기능 및 조건을 이해할 수 있는 서비스인가?
   - 내부적 일관성: 해당 서비스 내 화면들이 일관된 스타일로 규칙을 가지고 있는가?

## 응답 형식 (JSON)
다음 JSON 형식으로 응답해주세요:

{
  "summary": "화면 전체 레이아웃과 주요 UI 요소에 대한 2-3문장 요약",
  "categories": [
    {
      "id": "ui-design", "name": "UI 디자인", "score": 4.0,
      "summary": "카테고리 전체 요약 (2-3문장)",
      "improvements": ["상세 개선사항 또는 장점"],
      "criteria": [
        {"id": "visual-hierarchy", "name": "시각적 계층", "score": 4.0, "improvements": ["상세 내용"]},
        {"id": "color-contrast", "name": "색상 및 대비", "score": 4.0, "improvements": ["상세 내용"]},
        {"id": "typography", "name": "타이포그래피", "score": 4.0, "improvements": ["상세 내용"]},
        {"id": "spacing-layout", "name": "여백 및 레이아웃", "score": 4.0, "improvements": ["상세 내용"]}
      ]
    },
    {
      "id": "convenience", "name": "편의성", "score": 4.0,
      "summary": "카테고리 전체 요약 (2-3문장)",
      "improvements": ["상세 개선사항 또는 장점"],
      "criteria": [
        {"id": "efficiency", "name": "효율성, 편의성", "score": 4.0, "improvements": ["상세 내용"]},
        {"id": "responsiveness", "name": "반응성", "score": 4.0, "improvements": ["상세 내용"]}
      ]
    }
  ]
}

## 중요: improvements 작성 가이드

추상적이거나 모호한 피드백은 금지됩니다. 구체적인 UI 요소와 상황을 명시해주세요.

### 점수 4.0 미만일 때 작성 형식 (문제가 있는 경우):
**"[문제점] 현재 {구체적 UI 요소}가 {구체적인 문제 상황} → [원인] {왜 문제인지 UX 관점 설명} → [해결책] {구체적인 개선 방법과 수치/예시}"**

### 점수 4.0 이상일 때 (문제가 없는 경우):
장점을 자유롭게 서술하세요. 형식 제한 없이 구체적인 UI 요소와 그것이 왜 좋은지 설명하면 됩니다.
예시: "상단 헤더의 검색창이 눈에 잘 띄는 위치에 배치되어 있고, 플레이스홀더 텍스트가 사용자에게 명확한 가이드를 제공합니다."

### 개선이 필요한 경우의 예시 (점수 4.0 미만):

1. 효율성 관련:
   - ❌ "클릭 횟수가 많습니다" (너무 추상적)
   - ✅ "[문제] 상품 구매까지 5단계(상품선택→장바구니→배송정보→결제정보→확인)를 거쳐야 함 → [원인] 각 단계마다 페이지 이동이 발생하여 이탈률 증가 → [해결책] 원페이지 체크아웃으로 통합하고, 배송정보/결제정보를 아코디언 형태로 한 화면에 구성. 기존 회원은 '빠른 결제' 버튼으로 2클릭 내 구매 가능하게 개선"

2. 반응성 관련:
   - ❌ "버튼 피드백이 부족합니다" (너무 추상적)
   - ✅ "[문제] 하단 '구매하기' 버튼(파란색 #3B82F6) 터치 시 시각적 변화가 없어 사용자가 버튼이 눌렸는지 확인 불가 → [원인] active/pressed 상태 스타일이 정의되지 않음 → [해결책] 터치 시 버튼 색상을 #2563EB로 어둡게 변경하고, 0.1초 동안 scale(0.98) 축소 애니메이션 적용. 추가로 haptic feedback(진동) 제공 권장"

3. 오류 회복성 관련:
   - ❌ "오류 메시지가 불친절합니다" (너무 추상적)
   - ✅ "[문제] 결제 실패 시 '오류가 발생했습니다(code: 500)' 메시지만 표시됨 → [원인] 기술적 오류 코드는 사용자에게 의미 없고, 다음 행동 가이드가 없어 당황함 → [해결책] '일시적인 결제 오류가 발생했어요. 카드사 점검 중일 수 있습니다.' + '다시 시도하기' 버튼 + '다른 결제 수단으로 변경' 링크 제공. 3회 연속 실패 시 고객센터 연결 안내 추가"

4. 사전 방지성 관련:
   - ❌ "입력 가이드가 필요합니다" (너무 추상적)
   - ✅ "[문제] 비밀번호 입력 필드에 조건 안내 없이 '비밀번호'라고만 표시됨 → [원인] 사용자가 8자 이상, 특수문자 포함 등 조건을 모른 채 입력 후 제출하면 오류 발생 → [해결책] 입력 필드 하단에 실시간으로 '✓ 8자 이상 / ✗ 특수문자 포함 / ✓ 영문+숫자 조합' 체크리스트 표시. 조건 충족 시 초록색, 미충족 시 회색으로 표시"

5. 직관성 관련:
   - ❌ "정보 계층이 불명확합니다" (너무 추상적)
   - ✅ "[문제] 상품 상세 페이지에서 '가격(₩89,000)'과 '할인가(₩62,300)'가 같은 크기(16px)로 나란히 표시됨 → [원인] 시각적 차별화가 없어 할인 혜택을 즉시 인지하기 어려움 → [해결책] 할인가를 24px 볼드체 + 빨간색(#DC2626)으로 강조하고, 원가는 14px + 취소선 + 회색(#9CA3AF)으로 처리. 할인율 '30% OFF' 뱃지를 가격 옆에 추가"

6. 보편성 관련:
   - ❌ "익숙하지 않은 아이콘입니다" (너무 추상적)
   - ✅ "[문제] 장바구니 아이콘이 쇼핑백 대신 별 모양(★)으로 표현되어 있음 → [원인] 대부분의 이커머스에서 장바구니는 카트/바구니/쇼핑백 아이콘을 사용하므로 별 모양은 '즐겨찾기'로 오인될 수 있음 → [해결책] 표준 쇼핑백 또는 카트 아이콘으로 변경. Material Icons의 'shopping_cart' 또는 'shopping_bag' 사용 권장"

### 나쁜 improvements (금지):
- "UI를 개선해야 합니다" ❌
- "사용성이 떨어집니다" ❌
- "더 명확하게 해야 합니다" ❌
- "사용자 경험을 고려해야 합니다" ❌

### 점수별 피드백 깊이:
- 점수 4.0+ (우수): 장점 위주로 자유롭게 서술 (형식 제한 없음). 더 좋아질 수 있는 미세한 개선점이 있다면 1개 정도 제시
- 점수 3.0-3.9 (개선 필요): "[문제] → [원인] → [해결책]" 형식으로 구체적 해결책 2-3개 제시
- 점수 3.0 미만 (문제): "[문제] → [원인] → [해결책]" 형식으로 심각한 UX 이슈 상세 분석 + 우선순위별 해결책 3개 이상 제시

### criteria별 improvements 작성 규칙:
- 점수 4.0 이상: 장점을 자유롭게 서술하고, 개선점은 선택적으로 작성
- 점수 4.0 미만: "[문제] → [원인] → [해결책]" 형식을 사용하여 구체적인 UI 요소와 문제점을 명시
- 실제 측정 가능한 수치(px, 초, 클릭 수 등)를 포함하면 좋음
- 업계 표준이나 모범 사례 참조 시 출처 언급 (예: "Material Design 가이드라인에 따르면...")

주의: categories 배열에는 ui-design, convenience, accuracy, meaningfulness, flexibility, consistency 6개가 모두 포함되어야 합니다.

점수는 1.0~5.0 사이로 소수점 한자리까지 평가해주세요.
반드시 위 형식의 완전한 JSON만 응답하고 다른 텍스트는 포함하지 마세요.`

  try {
    // Prepare message content
    let messageContent: string | Array<{ type: string; source?: { type: string; media_type: string; data: string }; text?: string }>

    if (imageUrl) {
      console.log('Processing image URL:', imageUrl.substring(0, 50) + '...')

      const imageData = await imageUrlToBase64(imageUrl)

      // Validate image data before sending to API
      if (imageData &&
          imageData.base64 &&
          imageData.base64.length > 100 && // Minimum reasonable base64 length
          imageData.mediaType &&
          imageData.mediaType.startsWith('image/')) {
        console.log('Sending image to API with media type:', imageData.mediaType)
        messageContent = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageData.mediaType,
              data: imageData.base64,
            }
          },
          { type: 'text', text: prompt }
        ]
      } else {
        console.log('Image data invalid or not available, using text-only evaluation')
        messageContent = prompt
      }
    } else {
      console.log('No image URL provided, using text-only evaluation')
      messageContent = prompt
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
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API Error Response:', errorData)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse JSON from response with robust error handling
    let parsed
    try {
      // First try to find JSON block
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      // Clean up the JSON string
      let jsonStr = jsonMatch[0]

      // Remove any trailing content after the last closing brace
      let braceCount = 0
      let lastValidIndex = 0
      for (let i = 0; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') braceCount++
        if (jsonStr[i] === '}') {
          braceCount--
          if (braceCount === 0) {
            lastValidIndex = i
            break
          }
        }
      }
      if (lastValidIndex > 0) {
        jsonStr = jsonStr.substring(0, lastValidIndex + 1)
      }

      // Try to parse the cleaned JSON
      parsed = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw content:', content.substring(0, 500) + '...')

      // Try a more aggressive cleanup
      try {
        // Extract just the essential parts using regex
        const summaryMatch = content.match(/"summary"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/)
        const summary = summaryMatch ? summaryMatch[1].replace(/\\"/g, '"') : '평가를 완료했습니다.'

        // Create a minimal valid response
        parsed = {
          summary,
          annotations: [],
          categories: evaluationCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            score: 3.5,
            summary: `${cat.name} 평가가 완료되었습니다.`,
            improvements: ['상세 평가 결과를 확인해주세요.'],
            criteria: cat.criteria.map(c => ({
              id: c.id,
              name: c.name,
              score: 3.5,
              improvements: ['평가 중 오류가 발생하여 기본값이 적용되었습니다.']
            }))
          }))
        }
        console.warn('Using fallback response due to parse error')
      } catch {
        throw new Error('Failed to parse evaluation response')
      }
    }

    // Calculate overall score and counts
    let totalScore = 0
    let totalStrengths = 0
    let totalImprovements = 0

    parsed.categories.forEach((cat: CategoryEvaluation) => {
      totalScore += cat.score
      if (cat.score >= 4.0) totalStrengths++
      totalImprovements += cat.improvements?.length || 0
    })

    // 점수 계산 및 유효 범위 확인 (1.0 ~ 5.0)
    let overallScore = parsed.categories.length > 0
      ? totalScore / parsed.categories.length
      : 3.0 // 기본값

    overallScore = Math.round(overallScore * 10) / 10
    overallScore = Math.max(1.0, Math.min(5.0, overallScore)) // 1.0 ~ 5.0 범위 보장

    console.log('Evaluation result calculated:', {
      overallScore,
      totalStrengths,
      totalImprovements,
      categoriesCount: parsed.categories.length
    })

    return {
      screenId: `eval-${Date.now()}`,
      screenName,
      overallScore,
      totalStrengths,
      totalImprovements,
      summary: parsed.summary,
      categories: parsed.categories,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Evaluation error:', error)
    throw error
  }
}
