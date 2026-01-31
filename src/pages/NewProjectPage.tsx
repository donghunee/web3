import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Moon, Sun, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { createProject } from '@/lib/supabase'

interface NewProjectPageProps {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

// Evaluation criteria categories
const categories = [
  { id: 'convenience', title: '편의성', color: 'bg-red-500' },
  { id: 'accuracy', title: '정확성', color: 'bg-red-400' },
  { id: 'meaningfulness', title: '의미성', color: 'bg-gray-500' },
  { id: 'flexibility', title: '유연성', color: 'bg-gray-400' },
  { id: 'consistency', title: '일관성', color: 'bg-gray-500' },
]

// Evaluation criteria based on the provided image
const heuristics = [
  // 편의성 (Convenience)
  {
    id: 'efficiency',
    category: 'convenience',
    title: '효율성, 편의성',
    question: '원하는 목적을 달성하는데 소모되는 자원의 효율이 최적화되어 있는가?',
    definition: '사용자가 목적을 빠르게 달성할 수 있도록 불필요한 과정을 제거하고 단계를 축소하여 제공해야 한다.',
    examples: ['예매 시 이전으로 돌아가 시간, 좌석 수정', '파일의 복구, 되살리기'],
    keywords: ['효율', '빠르게', '단계', '축소', '최적화'],
  },
  {
    id: 'responsiveness',
    category: 'convenience',
    title: '반응성',
    question: '사용자의 조작에 따라 인터페이스가 활성화됨을 시각적으로 명확하게 확인할 수 있는가?',
    definition: '사용자 행위에 대한 시스템의 반응속도와 관련된 속성. 시스템 현재 상태를 명확하게 나타낼 수 있어야 한다.',
    examples: ['파일 다운로드 진행율, 로딩페이지', '가입진행 시 어느단계에 있는지'],
    keywords: ['반응', '로딩', '진행', '상태', '피드백'],
  },
  // 정확성 (Accuracy)
  {
    id: 'error-recovery',
    category: 'accuracy',
    title: '오류 회복성',
    question: '예상치 못한 오류 발생 시 사후처리, 조치에 대한 인터랙션이 적절하게 일어나는가?',
    definition: '사용자의 오류 처리 또는 그 복구 역시 쉽고 자유롭게 할 수 있도록 지원해야 한다.',
    examples: ['예매 시 이전페이지로 돌아가 시간, 좌석 수정', '파일의 복구, 되살리기'],
    keywords: ['오류', '복구', '되돌리기', '취소', '수정'],
  },
  {
    id: 'error-prevention',
    category: 'accuracy',
    title: '사전 방지성',
    question: '오류가 발생하기 직전 시스템 상에서 사용자가 실수하지 않도록 가이드를 제공하고 있는가?',
    definition: '사람들이 오류를 저지를 수 있는 가능성을 미연에 제거하거나 실수를 범하는 것을 사전에 방지한다.',
    examples: ['필수 값을 넣고 나면 버튼 활성화', '접근권한/ 컨텐츠가 없는 메뉴 비활성화'],
    keywords: ['방지', '가이드', '활성화', '비활성화', '검증'],
  },
  {
    id: 'learnability',
    category: 'accuracy',
    title: '학습 용이성',
    question: '사용자가 응용법을 적절히 배울/인지할 수 있도록 서비스가 지원하고 있는가?',
    definition: '사용자가 조작할 때 마다 쉽게 인식할 수 있도록 사용정보들이 잘 보이도록 설계해야 한다.',
    examples: ['온보딩', '툴팁', '도움말'],
    keywords: ['학습', '배움', '인지', '온보딩', '가이드'],
  },
  // 의미성 (Meaningfulness)
  {
    id: 'feedback',
    category: 'meaningfulness',
    title: '피드백',
    question: '시스템의 상태가 전환되었을 때 사용자가 인지할 수 있는 인터랙션을 제공하고 있는가?',
    definition: '시스템 내부 상태가 변화했을 때 사용자가 변화된 상태를 감지할 수 있게 제공하는 속성이 있어야 한다. 사용자에게 항상 어드위치에 있고 어떤 조작을 하고 있는지에 대한 정보를 제공해야 한다.',
    examples: ['알림', '토스트 메시지', '상태 변경 애니메이션'],
    keywords: ['피드백', '알림', '상태', '변화', '인지'],
  },
  {
    id: 'intuitiveness',
    category: 'meaningfulness',
    title: '직관성',
    question: '상대적인 정보의 중요도를 고려한 화면이 구성되어 있는가?',
    definition: '사용자가 정보를 한눈에 파악할 수 있도록 중요한 정보가 돋보일 수 있는 디자인과 레이아웃을 제공해야 한다.',
    examples: ['시각적 계층 구조', '강조 표시', '정보 우선순위'],
    keywords: ['직관', '중요도', '계층', '레이아웃', '강조'],
  },
  {
    id: 'universality',
    category: 'meaningfulness',
    title: '보편성',
    question: '사용자에게 시각적으로 익숙한 디자인과 화면구성을 제공하고 있는가?',
    definition: '보편적으로 통용되고 있는 디자인과 레이아웃을 제공해야 한다.',
    examples: ['표준 UI 패턴', '일반적인 아이콘 사용', '익숙한 네비게이션'],
    keywords: ['보편', '익숙', '표준', '통용', '일반적'],
  },
  {
    id: 'logic',
    category: 'meaningfulness',
    title: '논리성',
    question: '정보의 구성이나 순서가 논리적으로 제공되고 있어 이해하기 쉬운가?',
    definition: '사용자가 보기에 정보가 제공되는 순서나 구조가 논리적이라고 생각할 수 있어야 한다.',
    examples: ['순차적 프로세스', '그룹화된 정보', '명확한 흐름'],
    keywords: ['논리', '순서', '구조', '흐름', '이해'],
  },
  // 유연성 (Flexibility)
  {
    id: 'user-control',
    category: 'flexibility',
    title: '사용자 주도권 (유연성)',
    question: '처음 지정된 것 이외의 작업 또는 환경의 변화에 사용자가 적절히 적응할 수 있는가?',
    definition: '사용자 인터페이스는 사용자 개인의 기호에 맞게 맞춤화 할 수 있어야한다.',
    examples: ['즐겨찾기, 단축키 설정, 네이버 카테고리 설정 등'],
    keywords: ['맞춤', '설정', '개인화', '커스텀', '선호'],
  },
  {
    id: 'alternatives',
    category: 'flexibility',
    title: '대체성',
    question: '접근방식의 다양성으로 사용자의 기호에 맞게 선택할 수 있는 권한이 주어지고 있는가?',
    definition: '특정 작업 시 사용자가 원할 때 수행하는 방법이 두 가지 이상이 있어서 상황에 따라 선택할 수 있는 시스템을 의미',
    examples: ['리스트의 최신순, 가격순 정렬 기준', '회원 가입 방법의 다양화'],
    keywords: ['대체', '선택', '다양', '옵션', '방법'],
  },
  // 일관성 (Consistency)
  {
    id: 'predictability',
    category: 'consistency',
    title: '예측성',
    question: '보편적으로 사용되는 형태로 제공되어 사용자가 충분히 예측가능한 기능이 제공되고 있는가?',
    definition: '사용자가 서비스를 이해하고 예측할 수 있도록 어포던스 및 피드백을 제공해야 한다.',
    examples: ['일관된 버튼 동작', '예상 가능한 결과', '명확한 어포던스'],
    keywords: ['예측', '어포던스', '기대', '일관', '패턴'],
  },
  {
    id: 'regularity',
    category: 'consistency',
    title: '규칙성 (이해용이성)',
    question: '사용의 특정 목적, 기능 및 조건을 이해할 수 있는 서비스인가?',
    definition: '시스템은 다양한 작업을 수행하는 방식에 대해 일관성을 유지해야 한다.',
    examples: ['일관된 용어 사용', '통일된 인터랙션 패턴'],
    keywords: ['규칙', '이해', '일관', '통일', '패턴'],
  },
  {
    id: 'internal-consistency',
    category: 'consistency',
    title: '내부적 일관성',
    question: '해당 서비스 내 화면들이 일관된 스타일로 규칙을 가지고 있는가?',
    definition: '사이트/앱 내부적으로 일관된 스타일 및 규칙',
    examples: ['스타일 가이드', '디자인 시스템', '일관된 컴포넌트'],
    keywords: ['일관', '스타일', '규칙', '디자인', '통일'],
  },
]

// Domain-based heuristic recommendations
const domainRecommendations: Record<string, string[]> = {
  'UX': ['intuitiveness', 'learnability', 'feedback', 'user-control', 'internal-consistency', 'predictability'],
  '분석': ['efficiency', 'intuitiveness', 'logic', 'feedback', 'alternatives', 'internal-consistency'],
  'SaaS': ['efficiency', 'learnability', 'user-control', 'feedback', 'predictability', 'internal-consistency'],
  '대시보드': ['intuitiveness', 'logic', 'feedback', 'user-control', 'alternatives', 'internal-consistency'],
  '이커머스': ['efficiency', 'responsiveness', 'error-prevention', 'feedback', 'intuitiveness', 'predictability'],
  '커머스': ['efficiency', 'responsiveness', 'error-prevention', 'feedback', 'intuitiveness', 'predictability'],
  '쇼핑': ['efficiency', 'responsiveness', 'error-recovery', 'intuitiveness', 'universality', 'alternatives'],
  '금융': ['error-prevention', 'error-recovery', 'feedback', 'predictability', 'regularity', 'internal-consistency'],
  '뱅킹': ['error-prevention', 'error-recovery', 'feedback', 'predictability', 'regularity', 'internal-consistency'],
  '교육': ['learnability', 'feedback', 'intuitiveness', 'logic', 'universality', 'predictability'],
  '학습': ['learnability', 'feedback', 'intuitiveness', 'logic', 'user-control', 'predictability'],
  '헬스케어': ['error-prevention', 'feedback', 'intuitiveness', 'predictability', 'regularity', 'internal-consistency'],
  '의료': ['error-prevention', 'feedback', 'intuitiveness', 'predictability', 'regularity', 'internal-consistency'],
  '소셜': ['responsiveness', 'feedback', 'intuitiveness', 'user-control', 'alternatives', 'universality'],
  'SNS': ['responsiveness', 'feedback', 'intuitiveness', 'user-control', 'alternatives', 'universality'],
  '생산성': ['efficiency', 'user-control', 'alternatives', 'predictability', 'regularity', 'internal-consistency'],
  '업무': ['efficiency', 'user-control', 'alternatives', 'predictability', 'regularity', 'internal-consistency'],
  '엔터테인먼트': ['responsiveness', 'feedback', 'intuitiveness', 'universality', 'user-control', 'alternatives'],
  '게임': ['responsiveness', 'feedback', 'intuitiveness', 'universality', 'user-control', 'alternatives'],
  '여행': ['efficiency', 'error-prevention', 'intuitiveness', 'logic', 'alternatives', 'predictability'],
  '배달': ['efficiency', 'responsiveness', 'error-recovery', 'feedback', 'intuitiveness', 'predictability'],
  '음식': ['efficiency', 'responsiveness', 'intuitiveness', 'universality', 'alternatives', 'predictability'],
}

function getRecommendedHeuristics(domain: string, description: string): string[] {
  const recommended = new Set<string>()

  // Check domain keywords
  const domainLower = domain.toLowerCase()
  for (const [keyword, heuristicIds] of Object.entries(domainRecommendations)) {
    if (domainLower.includes(keyword.toLowerCase())) {
      heuristicIds.forEach(id => recommended.add(id))
    }
  }

  // Check description keywords
  const descLower = description.toLowerCase()
  for (const heuristic of heuristics) {
    for (const keyword of heuristic.keywords) {
      if (descLower.includes(keyword)) {
        recommended.add(heuristic.id)
      }
    }
  }

  // Ensure at least one item per category is selected
  for (const category of categories) {
    const categoryItems = heuristics.filter(h => h.category === category.id)
    const hasSelectedInCategory = categoryItems.some(item => recommended.has(item.id))
    if (!hasSelectedInCategory && categoryItems.length > 0) {
      // Add the first item of this category as default
      recommended.add(categoryItems[0].id)
    }
  }

  return Array.from(recommended)
}

// Group heuristics by category
function getHeuristicsByCategory() {
  return categories.map(category => ({
    ...category,
    items: heuristics.filter(h => h.category === category.id)
  }))
}

// Check if a heuristic is the last selected in its category
function isLastSelectedInCategory(heuristicId: string, selectedIds: string[]): boolean {
  const heuristic = heuristics.find(h => h.id === heuristicId)
  if (!heuristic) return false

  const categoryItems = heuristics.filter(h => h.category === heuristic.category)
  const selectedInCategory = categoryItems.filter(item => selectedIds.includes(item.id))

  return selectedInCategory.length === 1 && selectedInCategory[0].id === heuristicId
}

export function NewProjectPage({ isDarkMode, toggleDarkMode }: NewProjectPageProps) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)

  // Form state - Step 1
  const [projectName, setProjectName] = useState('')
  const [serviceDomain, setServiceDomain] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [targetUsers, setTargetUsers] = useState('')

  // Form state - Step 2
  const [selectedHeuristics, setSelectedHeuristics] = useState<string[]>([])

  const isStep1Valid = projectName.trim() && serviceDomain.trim() && serviceDescription.trim()

  // Check if all categories have at least one selected item
  const isStep2Valid = categories.every(category => {
    const categoryItems = heuristics.filter(h => h.category === category.id)
    return categoryItems.some(item => selectedHeuristics.includes(item.id))
  })

  const steps = [
    {
      number: 1,
      title: '서비스 정보',
      description: '도메인과 서비스 설명을 입력하세요',
    },
    {
      number: 2,
      title: '평가 기준 선택',
      description: '서비스에 적합한 평가 항목을 선택하세요',
    },
  ]

  // AI-based pre-selection when moving to step 2
  useEffect(() => {
    if (currentStep === 2 && selectedHeuristics.length === 0) {
      const recommended = getRecommendedHeuristics(serviceDomain, serviceDescription)
      setSelectedHeuristics(recommended)
    }
  }, [currentStep, serviceDomain, serviceDescription])

  const [isCreating, setIsCreating] = useState(false)

  const handleNext = async () => {
    if (currentStep === 1 && isStep1Valid) {
      setCurrentStep(2)
    } else if (currentStep === 2 && isStep2Valid) {
      setIsCreating(true)

      try {
        // Save project to Supabase
        const project = await createProject({
          name: projectName,
          domain: serviceDomain,
          description: serviceDescription,
          target_users: targetUsers,
        })

        const today = new Date()
        const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

        navigate(`/project/${project?.id || Date.now()}`, {
          state: {
            projectId: project?.id,
            projectName,
            serviceDomain,
            serviceDescription,
            targetUsers,
            selectedHeuristics,
            createdAt: formattedDate,
          }
        })
      } catch (error) {
        console.error('Error creating project:', error)
      } finally {
        setIsCreating(false)
      }
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate('/')
    }
  }

  const toggleHeuristic = (id: string) => {
    // Prevent unchecking if it's the last selected in the category
    if (selectedHeuristics.includes(id) && isLastSelectedInCategory(id, selectedHeuristics)) {
      return // Cannot uncheck - this is the last one in the category
    }
    setSelectedHeuristics(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    )
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">zero1ux</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "mx-auto px-6 py-8",
        currentStep === 2 ? "max-w-6xl" : "max-w-3xl"
      )}>
        {/* Back to Home */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">새 프로젝트 만들기</h1>
          <p className="text-muted-foreground">
            서비스 정보를 입력하고 평가 기준을 선택하세요.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep > step.number
                      ? "bg-blue-500 text-white"
                      : currentStep === step.number
                        ? "bg-blue-500 text-white"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.number ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <div>
                  <p className={cn(
                    "font-medium text-sm",
                    currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-16 h-px mx-4",
                  currentStep > step.number ? "bg-blue-500" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Service Information */}
        {currentStep === 1 && (
          <Card className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1">서비스 정보 입력</h2>
              <p className="text-sm text-muted-foreground">
                평가할 서비스의 기본 정보를 입력해주세요.
              </p>
            </div>

            <div className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="projectName">
                  프로젝트 이름 <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(Tab으로 자동완성)</span>
                </Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="예: zero1ux 대시보드 개선"
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !projectName.trim()) {
                      e.preventDefault()
                      setProjectName('zero1ux 대시보드 개선')
                    }
                  }}
                />
              </div>

              {/* Service Domain */}
              <div className="space-y-2">
                <Label htmlFor="serviceDomain">
                  서비스 도메인 <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(Tab으로 자동완성)</span>
                </Label>
                <Input
                  id="serviceDomain"
                  value={serviceDomain}
                  onChange={(e) => setServiceDomain(e.target.value)}
                  placeholder="예: UX 분석 SaaS"
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !serviceDomain.trim()) {
                      e.preventDefault()
                      setServiceDomain('UX 분석 SaaS')
                    }
                  }}
                />
              </div>

              {/* Service Description */}
              <div className="space-y-2">
                <Label htmlFor="serviceDescription">
                  서비스 설명 <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(Tab으로 자동완성)</span>
                </Label>
                <Textarea
                  id="serviceDescription"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="서비스의 주요 기능과 특징을 설명해주세요..."
                  rows={4}
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !serviceDescription.trim()) {
                      e.preventDefault()
                      setServiceDescription('AI 기반 UX 휴리스틱 평가 도구입니다. URL 입력만으로 스크린샷 분석, 평가 기준별 점수 산정, 개선 제안 리포트를 자동 생성합니다.')
                    }
                  }}
                />
              </div>

              {/* Target Users (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="targetUsers">
                  타겟 사용자 <span className="text-muted-foreground">(선택)</span>
                  <span className="text-xs text-muted-foreground ml-2">(Tab으로 자동완성)</span>
                </Label>
                <Input
                  id="targetUsers"
                  value={targetUsers}
                  onChange={(e) => setTargetUsers(e.target.value)}
                  placeholder="예: UX 디자이너, PM, 바이브 코더"
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !targetUsers.trim()) {
                      e.preventDefault()
                      setTargetUsers('UX 디자이너, 프로덕트 매니저, 초보 바이브 코더')
                    }
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Heuristic Selection */}
        {currentStep === 2 && (
          <>
            <Card className="p-6 mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">평가 기준 선택</h2>
                <p className="text-sm text-muted-foreground">
                  AI가 서비스 특성을 분석하여 적합한 평가 항목을 추천했습니다. 각 카테고리에서 최소 1개 항목이 선택되어야 합니다.
                </p>
              </div>
            </Card>

            {/* Category-based Cards */}
            <div className="space-y-8">
              {getHeuristicsByCategory().map((category) => {
                const selectedCount = category.items.filter(item =>
                  selectedHeuristics.includes(item.id)
                ).length

                const toggleCategoryAll = () => {
                  const categoryItemIds = category.items.map(item => item.id)
                  const allSelected = category.items.every(item =>
                    selectedHeuristics.includes(item.id)
                  )

                  if (allSelected) {
                    // Keep at least one selected
                    const firstItemId = category.items[0].id
                    setSelectedHeuristics(prev =>
                      prev.filter(id => !categoryItemIds.includes(id) || id === firstItemId)
                    )
                  } else {
                    // Select all in this category
                    setSelectedHeuristics(prev => {
                      const otherSelected = prev.filter(id => !categoryItemIds.includes(id))
                      return [...otherSelected, ...categoryItemIds]
                    })
                  }
                }

                const allCategorySelected = category.items.every(item =>
                  selectedHeuristics.includes(item.id)
                )

                return (
                  <div key={category.id}>
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{category.title}</h3>
                        <span className="px-3 py-1 text-sm font-medium rounded-full border bg-muted/50">
                          {selectedCount} / {category.items.length}
                        </span>
                      </div>
                      <button
                        onClick={toggleCategoryAll}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {allCategorySelected ? '전체 해제' : '전체 선택'}
                      </button>
                    </div>

                    {/* Items Grid */}
                    <div className="grid md:grid-cols-2 gap-3">
                      {category.items.map((heuristic) => {
                        const isSelected = selectedHeuristics.includes(heuristic.id)
                        const isLastInCategory = isLastSelectedInCategory(heuristic.id, selectedHeuristics)

                        return (
                          <Card
                            key={heuristic.id}
                            onClick={() => toggleHeuristic(heuristic.id)}
                            className={cn(
                              "p-4 cursor-pointer transition-all border",
                              isSelected
                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                                : "border-border hover:border-blue-200 dark:hover:border-blue-800 hover:bg-muted/30",
                              isLastInCategory && isSelected && "cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <div
                                className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                                  isSelected
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-muted-foreground/30"
                                )}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className={cn(
                                  "font-semibold mb-1",
                                  isSelected ? "text-blue-700 dark:text-blue-300" : "text-foreground"
                                )}>
                                  {heuristic.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {heuristic.question}
                                </p>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStep === 1 ? !isStep1Valid : (!isStep2Valid || isCreating)}
            className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            {currentStep === 2 ? (isCreating ? '생성 중...' : '프로젝트 생성') : '다음'}
            {currentStep === 1 && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </main>
    </div>
  )
}
