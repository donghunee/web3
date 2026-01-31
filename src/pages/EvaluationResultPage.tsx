import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Moon, Sun, Sparkles, Monitor, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { EvaluationResult, CategoryEvaluation } from '@/lib/evaluation'
import { getEvaluationResultById, getScreenById, type Screen } from '@/lib/supabase'

interface EvaluationResultPageProps {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

// Simple Radar Chart Component
function RadarChart({ categories }: { categories: CategoryEvaluation[] }) {
  const width = 240
  const height = 240
  const centerX = width / 2
  const centerY = height / 2 + 10  // Shift down slightly to give more room for top label
  const radius = 70
  const labelOffset = 30
  const angleStep = (2 * Math.PI) / categories.length

  // Calculate points for the radar
  const points = categories.map((cat, i) => {
    const angle = i * angleStep - Math.PI / 2
    const value = (cat.score / 5) * radius
    return {
      x: centerX + value * Math.cos(angle),
      y: centerY + value * Math.sin(angle),
      labelX: centerX + (radius + labelOffset) * Math.cos(angle),
      labelY: centerY + (radius + labelOffset) * Math.sin(angle),
      name: cat.name,
    }
  })

  // Grid lines
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <svg width={width} height={height} className="mx-auto">
      {/* Grid */}
      {gridLevels.map((level, i) => (
        <polygon
          key={i}
          points={categories.map((_, j) => {
            const angle = j * angleStep - Math.PI / 2
            const r = level * radius
            return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`
          }).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      {categories.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        return (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={centerX + radius * Math.cos(angle)}
            y2={centerY + radius * Math.sin(angle)}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="rgb(59, 130, 246)"
        strokeWidth={2}
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="rgb(59, 130, 246)" />
      ))}

      {/* Labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.labelX}
          y={p.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-muted-foreground"
        >
          {p.name}
        </text>
      ))}
    </svg>
  )
}

// Screen Image Component
function ScreenImage({
  imageUrl,
  screenName,
}: {
  imageUrl: string
  screenName: string
}) {
  return (
    <Card className="p-4 mb-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <Monitor className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">분석된 화면</h3>
      </div>

      <div className="rounded-lg overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={screenName}
          className="w-full h-auto block"
          style={{ maxHeight: '600px', objectFit: 'contain', objectPosition: 'top' }}
        />
      </div>
    </Card>
  )
}

// Category Card Component
function CategoryCard({ category }: { category: CategoryEvaluation }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="p-6">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold">{category.name}</h3>
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-blue-600">
            {category.score.toFixed(1)} / 5.0
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Summary */}
      <p className="text-muted-foreground mt-3">{category.summary}</p>

      {/* Improvements */}
      {category.improvements && category.improvements.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">개선 제안</span>
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {category.improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expanded: Criteria Details */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-4">세부 항목</h4>
          <div className="space-y-4">
            {category.criteria.map((criterion) => (
              <div key={criterion.id} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm">{criterion.name}</p>
                  {criterion.improvements && criterion.improvements.length > 0 && (
                    <ul className="mt-1 text-sm text-muted-foreground">
                      {criterion.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span>•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  {criterion.score.toFixed(1)} / 5.0
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export function EvaluationResultPage({ isDarkMode, toggleDarkMode }: EvaluationResultPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const [result, setResult] = useState<EvaluationResult | null>(location.state?.result || null)
  const [screen, setScreen] = useState<Screen | null>(location.state?.screen || null)
  const [isLoading, setIsLoading] = useState(!location.state?.result)

  // Load result and screen from Supabase
  useEffect(() => {
    async function loadData() {
      if (id) {
        setIsLoading(true)

        // Load result if not passed via state
        let screenId: string | null = null
        if (!result) {
          const dbResult = await getEvaluationResultById(id)
          if (dbResult) {
            screenId = dbResult.screen_id
            setResult({
              screenId: dbResult.screen_id || dbResult.id,
              screenName: dbResult.screen_name,
              overallScore: Number(dbResult.overall_score),
              totalStrengths: dbResult.total_strengths,
              totalImprovements: dbResult.total_improvements,
              summary: dbResult.summary,
              categories: dbResult.categories as CategoryEvaluation[],
              createdAt: dbResult.created_at,
            })
          }
        } else {
          screenId = result.screenId
        }

        // Load screen to get screenshot (if not already loaded from state)
        if (!screen && screenId && !screenId.startsWith('local-') && !screenId.startsWith('eval-')) {
          const screenData = await getScreenById(screenId)
          if (screenData) {
            setScreen(screenData)
          }
        }

        setIsLoading(false)
      }
    }
    loadData()
  }, [id, result])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">평가 결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">평가 결과를 찾을 수 없습니다.</p>
          <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
        </div>
      </div>
    )
  }

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return '우수'
    if (score >= 4.0) return '양호'
    if (score >= 3.0) return '보통'
    if (score >= 2.0) return '미흡'
    return '부족'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">UX Analyzer</span>
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
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>

        {/* Screenshot Section */}
        {screen?.image_url && (
          <ScreenImage
            imageUrl={screen.image_url}
            screenName={result.screenName}
          />
        )}

        {/* Result Header Card */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-muted flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{result.screenName}</h1>
                  <p className="text-sm text-muted-foreground">AI 휴리스틱 평가 리포트</p>
                </div>
              </div>

              {/* Score and Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">종합 점수</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(result.overallScore / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold">{result.overallScore.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">강점 항목</span>
                  <span className="font-semibold text-emerald-600">{result.totalStrengths}개</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">개선 필요</span>
                  <span className="font-semibold text-amber-600">{result.totalImprovements}개</span>
                </div>
              </div>

              {/* Overall Score Badge */}
              <div className="mt-4">
                <span className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold",
                  result.overallScore >= 4.0
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : result.overallScore >= 3.0
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}>
                  {result.overallScore.toFixed(1)} / 5.0 ({getScoreLabel(result.overallScore)})
                </span>
              </div>
            </div>

            {/* Right: Radar Chart */}
            <div className="flex-shrink-0">
              <RadarChart categories={result.categories} />
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
            <h3 className="font-semibold mb-2">종합 평가</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
          </div>
        </Card>

        {/* Category Results */}
        <div className="space-y-4">
          {result.categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </main>
    </div>
  )
}
