import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Moon, Sun, Sparkles, Calendar, CheckCircle2, Plus, Image, Monitor, Clock, Play, Link, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { uploadScreenshot, createScreen, getScreensByProjectId, saveEvaluationResult, getProjectById, type Screen } from '@/lib/supabase'
import { evaluateScreen } from '@/lib/evaluation'
import { analyzeUrl, screenshotUrlToFile } from '@/lib/urlAnalysis'
import { analyzePerformance, getScoreColor, getVitalStatus, getVitalStatusColor, formatVitalValue, type PerformanceResult } from '@/lib/performanceAnalysis'

interface ProjectDetailPageProps {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

interface ProjectData {
  projectId?: string
  projectName: string
  serviceDomain: string
  serviceDescription: string
  targetUsers: string
  selectedHeuristics: string[]
  createdAt: string
}

// Heuristic titles mapping
const heuristicTitles: Record<string, string> = {
  'efficiency': '효율성, 편의성',
  'responsiveness': '반응성',
  'error-recovery': '오류 회복성',
  'error-prevention': '사전 방지성',
  'learnability': '학습 용이성',
  'feedback': '피드백',
  'intuitiveness': '직관성',
  'universality': '보편성',
  'logic': '논리성',
  'user-control': '사용자 주도권',
  'alternatives': '대체성',
  'predictability': '예측성',
  'regularity': '규칙성',
  'internal-consistency': '내부적 일관성',
}

export function ProjectDetailPage({ isDarkMode, toggleDarkMode }: ProjectDetailPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: projectIdFromUrl } = useParams<{ id: string }>()
  const projectFromState = location.state as ProjectData | null

  // Project state
  const [project, setProject] = useState<ProjectData | null>(projectFromState)
  const [isLoadingProject, setIsLoadingProject] = useState(!projectFromState)

  // Screens state
  const [screens, setScreens] = useState<Screen[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [evaluatingScreenId, setEvaluatingScreenId] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload')
  const [screenName, setScreenName] = useState('')
  const [screenPurpose, setScreenPurpose] = useState('')
  const [userActions, setUserActions] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // URL input state
  const [urlInput, setUrlInput] = useState('')
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false)
  const [urlScreenshotUrl, setUrlScreenshotUrl] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

  // Performance analysis state
  const [performanceResult, setPerformanceResult] = useState<PerformanceResult | null>(null)
  const [isAnalyzingPerformance, setIsAnalyzingPerformance] = useState(false)

  // AI Evaluation progress modal state
  type EvaluationStep = 'preparing' | 'grid' | 'analyzing' | 'saving' | 'complete' | 'error'
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false)
  const [evaluationStep, setEvaluationStep] = useState<EvaluationStep>('preparing')
  const [evaluationProgress, setEvaluationProgress] = useState(0)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)

  const isFormValid = screenName.trim() && screenPurpose.trim() && userActions.trim()

  // Load project from DB if not passed via state
  useEffect(() => {
    async function loadProject() {
      if (!projectFromState && projectIdFromUrl) {
        setIsLoadingProject(true)
        const dbProject = await getProjectById(projectIdFromUrl)
        if (dbProject) {
          setProject({
            projectId: dbProject.id,
            projectName: dbProject.name,
            serviceDomain: dbProject.domain,
            serviceDescription: dbProject.description || '',
            targetUsers: dbProject.target_users || '',
            selectedHeuristics: [], // Will be loaded separately if needed
            createdAt: new Date(dbProject.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }),
          })
        }
        setIsLoadingProject(false)
      }
    }
    loadProject()
  }, [projectFromState, projectIdFromUrl])

  // Load screens when project changes
  useEffect(() => {
    const projectId = project?.projectId || projectIdFromUrl
    if (projectId) {
      loadScreens(projectId)
    }
  }, [project?.projectId, projectIdFromUrl])

  const loadScreens = async (projectId: string) => {
    setIsLoading(true)
    const loadedScreens = await getScreensByProjectId(projectId)
    setScreens(loadedScreens)
    setIsLoading(false)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        setScreenshot(file)
        setScreenshotPreview(URL.createObjectURL(file))
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setScreenshot(file)
      setScreenshotPreview(URL.createObjectURL(file))
    }
  }

  // URL analysis handler
  const handleAnalyzeUrl = async () => {
    if (!urlInput.trim()) return

    setIsAnalyzingUrl(true)
    setUrlError(null)
    setUrlScreenshotUrl(null)
    setPerformanceResult(null)

    try {
      const result = await analyzeUrl(urlInput.trim())

      // Set screenshot preview
      setUrlScreenshotUrl(result.screenshotUrl)

      // Auto-fill form fields from metadata
      if (!screenName && result.metadata.title) {
        setScreenName(result.metadata.title)
      }
      if (!screenPurpose && result.metadata.description) {
        setScreenPurpose(result.metadata.description)
      }

      // Start performance analysis in background
      setIsAnalyzingPerformance(true)
      try {
        const perfResult = await analyzePerformance(urlInput.trim(), 'mobile')
        setPerformanceResult(perfResult)
      } catch (perfError) {
        console.error('Performance analysis error:', perfError)
        // Don't show error - performance analysis is optional
      } finally {
        setIsAnalyzingPerformance(false)
      }
    } catch (error) {
      console.error('URL analysis error:', error)
      setUrlError('URL을 분석할 수 없습니다. 유효한 URL인지 확인해주세요.')
    } finally {
      setIsAnalyzingUrl(false)
    }
  }

  const handleAddScreen = async () => {
    setIsSaving(true)
    const currentProjectId = project?.projectId || projectIdFromUrl

    try {
      let imageUrl: string | null = null

      // If we have a projectId, save to Supabase
      if (currentProjectId) {
        // Handle URL mode - convert screenshot URL to file and upload
        if (activeTab === 'url' && urlScreenshotUrl) {
          const screenshotFile = await screenshotUrlToFile(urlScreenshotUrl, `url-screenshot-${Date.now()}.png`)
          if (screenshotFile) {
            imageUrl = await uploadScreenshot(screenshotFile, currentProjectId)
          } else {
            // Fallback: use the direct URL
            imageUrl = urlScreenshotUrl
          }
        } else if (screenshot) {
          // Handle upload mode
          imageUrl = await uploadScreenshot(screenshot, currentProjectId)
        }

        // Create screen in database
        const newScreen = await createScreen({
          project_id: currentProjectId,
          name: screenName,
          purpose: screenPurpose,
          key_actions: userActions.split('\n').filter(a => a.trim()),
          image_url: imageUrl,
        })

        if (newScreen) {
          setScreens(prev => [...prev, newScreen])
        }
      } else {
        // No projectId - create local screen
        if (activeTab === 'url' && urlScreenshotUrl) {
          imageUrl = urlScreenshotUrl
        } else if (screenshot) {
          imageUrl = URL.createObjectURL(screenshot)
        }

        const localScreen: Screen = {
          id: `local-${Date.now()}`,
          project_id: '',
          name: screenName,
          purpose: screenPurpose,
          key_actions: userActions.split('\n').filter(a => a.trim()),
          image_url: imageUrl,
          description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setScreens(prev => [...prev, localScreen])
      }

      // Reset form and close modal
      handleCloseModal()
    } catch (error) {
      console.error('Error adding screen:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseModal = () => {
    setScreenName('')
    setScreenPurpose('')
    setUserActions('')
    setScreenshot(null)
    setScreenshotPreview(null)
    setUrlInput('')
    setUrlScreenshotUrl(null)
    setUrlError(null)
    setPerformanceResult(null)
    setActiveTab('upload')
    setIsModalOpen(false)
  }

  const handleStartEvaluation = async (screen: Screen) => {
    setEvaluatingScreenId(screen.id)
    setIsEvaluationModalOpen(true)
    setEvaluationStep('preparing')
    setEvaluationProgress(0)
    setEvaluationError(null)

    try {
      // Step 1: Preparing
      setEvaluationStep('preparing')
      setEvaluationProgress(10)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 2: Grid overlay (if image exists)
      if (screen.image_url) {
        setEvaluationStep('grid')
        setEvaluationProgress(25)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Step 3: AI Analysis
      setEvaluationStep('analyzing')
      setEvaluationProgress(40)

      const result = await evaluateScreen(
        screen.name,
        screen.purpose,
        screen.key_actions || [],
        screen.image_url
      )

      setEvaluationProgress(80)

      // Step 4: Saving
      setEvaluationStep('saving')
      setEvaluationProgress(90)

      const savedResult = await saveEvaluationResult({
        screen_id: screen.id.startsWith('local-') ? null : screen.id,
        screen_name: result.screenName,
        overall_score: result.overallScore,
        total_strengths: result.totalStrengths,
        total_improvements: result.totalImprovements,
        summary: result.summary,
        categories: result.categories,
      })

      // Step 5: Complete
      setEvaluationStep('complete')
      setEvaluationProgress(100)

      const finalResult = savedResult ? { ...result, id: savedResult.id } : result

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 800))

      setIsEvaluationModalOpen(false)

      // Navigate to evaluation result page
      navigate(`/evaluation/${savedResult?.id || screen.id}`, {
        state: {
          result: finalResult,
          project,
          screen,
        }
      })
    } catch (error) {
      console.error('Evaluation failed:', error)
      setEvaluationStep('error')
      setEvaluationError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setEvaluatingScreenId(null)
    }
  }

  const handleCloseEvaluationModal = () => {
    if (evaluationStep === 'error' || evaluationStep === 'complete') {
      setIsEvaluationModalOpen(false)
      setEvaluationError(null)
    }
  }

  // Loading state
  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Redirect if no project data
  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">프로젝트 정보를 찾을 수 없습니다.</p>
          <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
        </div>
      </div>
    )
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
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          프로젝트 목록
        </button>

        {/* Project Info Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold">{project.projectName}</h1>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-muted">
              {project.serviceDomain}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="w-4 h-4" />
            <span>{project.createdAt}</span>
          </div>

          <p className="text-muted-foreground mb-6">{project.serviceDescription}</p>

          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">
              선택된 평가 기준 ({project.selectedHeuristics.length}개)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.selectedHeuristics.map((id) => (
              <span
                key={id}
                className="px-3 py-1.5 text-sm rounded-full bg-muted text-muted-foreground"
              >
                {heuristicTitles[id] || id}
              </span>
            ))}
          </div>
        </Card>

        {/* Screen Analysis Section */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">화면 분석</h2>
            <p className="text-sm text-muted-foreground">
              분석할 화면을 추가하고 AI 평가를 진행하세요
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="w-4 h-4" />
            화면 추가
          </Button>
        </div>

        {/* Screen Cards or Empty State */}
        {isLoading ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">화면 목록을 불러오는 중...</p>
            </div>
          </Card>
        ) : screens.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {screens.map((screen) => (
              <Card key={screen.id} className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{screen.name}</span>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-full bg-muted text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    대기 중
                  </span>
                </div>

                {/* Screenshot */}
                <div className="aspect-video rounded-lg bg-muted mb-4 overflow-hidden flex items-center justify-center">
                  {screen.image_url ? (
                    <img
                      src={screen.image_url}
                      alt={screen.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="w-12 h-12 text-muted-foreground/30" />
                  )}
                </div>

                {/* Purpose */}
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-1">화면 목적</p>
                  <p className="text-sm">{screen.purpose}</p>
                </div>

                {/* Actions */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">사용자 액션</p>
                  <p className="text-sm">{screen.key_actions?.join(', ') || '-'}</p>
                </div>

                {/* Analyze Button */}
                <Button
                  size="sm"
                  onClick={() => handleStartEvaluation(screen)}
                  disabled={evaluatingScreenId === screen.id}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {evaluatingScreenId === screen.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      AI 분석 시작
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">아직 분석할 화면이 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-6">
                화면을 추가하고 AI 사용성 분석을 시작하세요.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Plus className="w-4 h-4" />
                첫 화면 추가하기
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Add Screen Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>분석할 화면 추가</DialogTitle>
            <DialogDescription>
              URL을 입력하거나 스크린샷을 업로드하세요.
            </DialogDescription>
          </DialogHeader>

          {/* Tab Buttons */}
          <div className="flex gap-2 border-b pb-2">
            <button
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'url'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Link className="w-4 h-4" />
              URL 입력
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Image className="w-4 h-4" />
              이미지 업로드
            </button>
          </div>

          <div className="space-y-4 py-4">
            {/* URL Input Tab */}
            {activeTab === 'url' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="urlInput">
                    웹페이지 URL <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="urlInput"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAnalyzeUrl()
                        }
                      }}
                    />
                    <Button
                      onClick={handleAnalyzeUrl}
                      disabled={!urlInput.trim() || isAnalyzingUrl}
                      className="gap-2"
                    >
                      {isAnalyzingUrl ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          분석 중
                        </>
                      ) : (
                        '분석'
                      )}
                    </Button>
                  </div>
                  {urlError && (
                    <p className="text-sm text-destructive">{urlError}</p>
                  )}
                </div>

                {/* URL Screenshot Preview */}
                {urlScreenshotUrl && (
                  <div className="space-y-2">
                    <Label>캡처된 스크린샷</Label>
                    <div className="border rounded-lg overflow-hidden bg-muted relative">
                      <img
                        src={urlScreenshotUrl}
                        alt="URL Screenshot"
                        className="w-full h-auto max-h-64 object-contain"
                        onLoad={() => setUrlError(null)}
                        onError={(e) => {
                          // Hide the broken image
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded hidden" id="screenshot-fallback">
                          스크린샷 미리보기 (저장 시 캡처됨)
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      페이지 정보가 자동으로 추출되었습니다. 필요시 수정하세요.
                    </p>
                  </div>
                )}

                {/* Performance Analysis Results */}
                {isAnalyzingPerformance && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-sm text-muted-foreground">성능 분석 중...</span>
                    </div>
                  </div>
                )}

                {performanceResult && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">성능 분석 결과</Label>
                      <span className="text-xs text-muted-foreground">Mobile</span>
                    </div>

                    {/* Scores Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: '성능', score: performanceResult.scores.performance },
                        { label: '접근성', score: performanceResult.scores.accessibility },
                        { label: '권장사항', score: performanceResult.scores.bestPractices },
                        { label: 'SEO', score: performanceResult.scores.seo },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className={`text-lg font-bold rounded-lg py-2 ${getScoreColor(item.score)}`}>
                            {item.score}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Core Web Vitals */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Core Web Vitals</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {[
                          { key: 'lcp', label: 'LCP', value: performanceResult.coreWebVitals.lcp },
                          { key: 'fid', label: 'FID', value: performanceResult.coreWebVitals.fid },
                          { key: 'cls', label: 'CLS', value: performanceResult.coreWebVitals.cls },
                        ].map((vital) => {
                          const status = getVitalStatus(vital.key, vital.value)
                          return (
                            <div key={vital.key} className={`p-2 rounded-lg text-center ${getVitalStatusColor(status)}`}>
                              <p className="font-medium">{vital.label}</p>
                              <p className="text-sm font-bold">{formatVitalValue(vital.key, vital.value)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Top Issues */}
                    {performanceResult.opportunities.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">개선 필요 항목</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {performanceResult.opportunities.slice(0, 5).map((issue) => (
                            <div key={issue.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                              <span className="truncate flex-1">{issue.title}</span>
                              {issue.displayValue && (
                                <span className="text-muted-foreground ml-2">{issue.displayValue}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-2">
                <Label>스크린샷 (선택)</Label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-border hover:border-blue-300'}
                    ${screenshot ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {screenshotPreview ? (
                    <div className="flex flex-col items-center w-full">
                      <img src={screenshotPreview} alt="Preview" className="w-full max-h-48 object-contain rounded mb-2" />
                      <p className="text-sm font-medium text-foreground">{screenshot?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">클릭하여 변경</p>
                    </div>
                  ) : (
                    <>
                      <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        스크린샷을 드래그하거나 클릭하세요
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF (최대 10MB)
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="screenName">
                화면 이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="screenName"
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
                placeholder="예: 회원가입 페이지"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenPurpose">
                화면의 목적 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="screenPurpose"
                value={screenPurpose}
                onChange={(e) => setScreenPurpose(e.target.value)}
                placeholder="이 화면에서 사용자가 달성해야 할 목표를 설명하세요..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userActions">
                사용자 액션 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="userActions"
                value={userActions}
                onChange={(e) => setUserActions(e.target.value)}
                placeholder="사용자가 이 화면에서 수행해야 할 구체적인 행동을 나열하세요..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={isSaving}>
              취소
            </Button>
            <Button
              onClick={handleAddScreen}
              disabled={
                !isFormValid ||
                isSaving ||
                (activeTab === 'url' && !urlScreenshotUrl)
              }
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isSaving ? '저장 중...' : '화면 추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Evaluation Progress Modal */}
      <Dialog open={isEvaluationModalOpen} onOpenChange={handleCloseEvaluationModal}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              AI 사용성 평가
            </DialogTitle>
            <DialogDescription>
              화면을 분석하고 있습니다. 잠시만 기다려주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">진행률</span>
                <span className="font-medium">{evaluationProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${evaluationProgress}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {[
                { key: 'preparing', label: '분석 준비', description: '이미지 데이터를 처리하고 있습니다' },
                { key: 'grid', label: '그리드 오버레이', description: '위치 파악을 위한 그리드를 생성합니다' },
                { key: 'analyzing', label: 'AI 분석 중', description: '휴리스틱 평가를 수행하고 있습니다' },
                { key: 'saving', label: '결과 저장', description: '평가 결과를 저장하고 있습니다' },
                { key: 'complete', label: '완료', description: '분석이 완료되었습니다' },
              ].map((step, index) => {
                const isActive = evaluationStep === step.key
                const isCompleted =
                  (step.key === 'preparing' && ['grid', 'analyzing', 'saving', 'complete'].includes(evaluationStep)) ||
                  (step.key === 'grid' && ['analyzing', 'saving', 'complete'].includes(evaluationStep)) ||
                  (step.key === 'analyzing' && ['saving', 'complete'].includes(evaluationStep)) ||
                  (step.key === 'saving' && evaluationStep === 'complete') ||
                  (step.key === 'complete' && evaluationStep === 'complete')

                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                      ${isCompleted ? 'bg-green-500 text-white' :
                        isActive ? 'bg-blue-500 text-white' :
                        'bg-muted text-muted-foreground'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Error State */}
            {evaluationStep === 'error' && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  오류가 발생했습니다
                </p>
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                  {evaluationError || '알 수 없는 오류가 발생했습니다.'}
                </p>
              </div>
            )}

            {/* Estimated Time */}
            {evaluationStep !== 'error' && evaluationStep !== 'complete' && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>예상 소요 시간: 약 15-30초</span>
              </div>
            )}
          </div>

          {/* Footer for error state */}
          {evaluationStep === 'error' && (
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseEvaluationModal}>
                닫기
              </Button>
              <Button
                onClick={() => {
                  setIsEvaluationModalOpen(false)
                  // Retry with the same screen
                  const screen = screens.find(s => s.id === evaluatingScreenId)
                  if (screen) {
                    setTimeout(() => handleStartEvaluation(screen), 100)
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600"
              >
                다시 시도
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
