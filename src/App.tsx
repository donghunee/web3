import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Moon, Sun, Sparkles, Target, FileText, BarChart3, Folder, Calendar, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { NewProjectPage } from '@/pages/NewProjectPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { EvaluationResultPage } from '@/pages/EvaluationResultPage'
import { getAllProjects, type Project } from '@/lib/supabase'
import './App.css'

const featureItems: BentoItem[] = [
  {
    title: '맞춤형 평가 기준',
    meta: 'AI 기반',
    description: '서비스 특성에 맞는 사용성 항목을 선별하여 진단 기준을 수립합니다.',
    icon: <Target className="w-4 h-4 text-blue-500" />,
    status: '핵심',
    tags: ['UX', '평가기준'],
    colSpan: 2,
    hasPersistentHover: true,
    cta: '자세히 보기 →',
  },
  {
    title: '상세 화면 분석',
    meta: '화면별 분석',
    description: '화면의 목적과 사용자 액션을 입력하면 AI가 깊이 있는 분석을 수행합니다.',
    icon: <FileText className="w-4 h-4 text-cyan-500" />,
    status: '분석',
    tags: ['AI', '분석'],
    cta: '자세히 보기 →',
  },
  {
    title: '5점 척도 리포트',
    meta: '상세 점수',
    description: '각 항목별 점수와 상세 분석, 개선 제안을 담은 리포트를 제공합니다.',
    icon: <BarChart3 className="w-4 h-4 text-emerald-500" />,
    status: '리포트',
    tags: ['점수', '개선'],
    colSpan: 2,
    cta: '자세히 보기 →',
  },
  {
    title: '빠른 평가',
    meta: '실시간',
    description: 'AI 기반 실시간 분석으로 빠르게 사용성 평가 결과를 확인하세요.',
    icon: <Zap className="w-4 h-4 text-amber-500" />,
    status: 'New',
    tags: ['속도', '효율'],
    cta: '자세히 보기 →',
  },
]

interface HomePageProps {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

function HomePage({ isDarkMode, toggleDarkMode }: HomePageProps) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setIsLoadingProjects(true)
    const loadedProjects = await getAllProjects()
    setProjects(loadedProjects)
    setIsLoadingProjects(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Transparent with Blur */}
      <header className="fixed top-0 z-50 w-full bg-transparent backdrop-blur-md border-b border-white/10 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground dark:text-white">zero1ux</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Hero Section with Aurora Background */}
      <AuroraBackground className="min-h-screen pt-14">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative z-10 max-w-6xl mx-auto px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-white/20 border border-gray-200/50 dark:border-white/20 shadow-lg dark:shadow-blue-500/10 mb-8 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-white/90">AI 기반 사용성 평가</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 dark:text-white">
            더 나은 사용자 경험을 위한
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600 mb-6">
            사용성 평가 서비스
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground dark:text-neutral-300 max-w-2xl mx-auto mb-10">
            서비스 컨텍스트를 설정해 주세요. 입력된 서비스 설명을 바탕으로 적절한 사용성 평가 기준을 설립해 일관된 기준으로 사용성을 평가해 드립니다.
          </p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Button
              size="lg"
              className="h-12 px-6 text-base font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25"
              onClick={() => navigate('/new-project')}
            >
              <Plus className="w-5 h-5" />
              새 프로젝트 시작하기
            </Button>
          </motion.div>
        </motion.div>
      </AuroraBackground>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">주요 기능</h2>
            <p className="text-muted-foreground">AI 기반 사용성 평가의 핵심 기능들을 소개합니다</p>
          </div>
          <BentoGrid items={featureItems} />
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-1">내 프로젝트</h2>
              <p className="text-sm text-muted-foreground">생성한 평가 프로젝트를 관리합니다</p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/new-project')}
            >
              <Plus className="w-4 h-4" />
              새 프로젝트
            </Button>
          </div>

          {/* Project Cards */}
          {isLoadingProjects ? (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">프로젝트를 불러오는 중...</p>
              </div>
            </Card>
          ) : projects.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="p-5 cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                      <Folder className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground flex-shrink-0">
                          {project.domain}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.description || '설명 없음'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Folder className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">아직 프로젝트가 없습니다</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  새 프로젝트를 생성하여 UX 분석을 시작하세요.
                </p>
                <Button
                  onClick={() => navigate('/new-project')}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  새 프로젝트 시작하기
                </Button>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            zero1ux - AI 기반 사용성 평가 서비스
          </p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/new-project"
          element={<NewProjectPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/project/:id"
          element={<ProjectDetailPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/evaluation/:id"
          element={<EvaluationResultPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
