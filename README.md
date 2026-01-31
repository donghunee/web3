# zero1ux

AI 기반 UX 휴리스틱 평가 서비스

## 소개

zero1ux는 서비스의 사용성(Usability)을 AI 기반으로 평가하고 개선점을 제안하는 도구입니다. 스크린샷 업로드만으로 UX 휴리스틱 분석, 점수 산정, 개선 UI 생성까지 자동으로 수행합니다.

### 주요 기능

- **맞춤형 평가 기준**: 서비스 도메인과 설명을 기반으로 AI가 적합한 휴리스틱 항목을 자동 추천
- **화면별 상세 분석**: 스크린샷 업로드 후 화면 목적과 사용자 액션을 입력하면 AI가 깊이 있는 분석 수행
- **5점 척도 리포트**: 편의성, 정확성, 의미성, 유연성, 일관성 5개 카테고리별 상세 점수 및 개선 제안
- **개선 UI 자동 생성**: 평가 결과를 바탕으로 v0/Lovable 수준의 프로덕션급 개선 UI 코드 생성

### 평가 기준 (휴리스틱)

| 카테고리 | 항목 |
|---------|------|
| 편의성 | 효율성/편의성, 반응성 |
| 정확성 | 오류 회복성, 사전 방지성, 학습 용이성 |
| 의미성 | 피드백, 직관성, 보편성, 논리성 |
| 유연성 | 사용자 주도권, 대체성 |
| 일관성 | 예측성, 규칙성, 내부적 일관성 |

## 기술 스택

- **Frontend**: React 19, TypeScript, Vite 7
- **Styling**: Tailwind CSS 4, Framer Motion
- **UI Components**: Radix UI, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Storage)
- **AI**: Claude API (Anthropic)

## 시작하기

### 요구사항

- Node.js 18+
- npm 또는 yarn
- Supabase 프로젝트
- Claude API Key

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd web-3

# 의존성 설치
npm install
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLAUDE_API_KEY=your_claude_api_key
```

### Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 다음 테이블 생성:

```sql
-- Projects 테이블
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text not null,
  description text,
  target_users text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Screens 테이블
create table screens (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  image_url text,
  description text,
  purpose text not null,
  key_actions text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Evaluation Results 테이블
create table evaluation_results (
  id uuid default gen_random_uuid() primary key,
  screen_id uuid references screens(id) on delete set null,
  screen_name text not null,
  overall_score numeric not null,
  total_strengths integer not null,
  total_improvements integer not null,
  summary text not null,
  categories jsonb not null,
  improved_ui_html text,
  improved_ui_description text,
  created_at timestamp with time zone default now()
);
```

3. Storage에서 `screen-images` 버킷 생성 (Public 접근 허용)

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 사용 방법

1. **프로젝트 생성**: 홈 화면에서 "새 프로젝트 시작하기" 클릭
2. **서비스 정보 입력**: 프로젝트 이름, 도메인, 설명 입력 (Tab 키로 예시 자동완성)
3. **평가 기준 선택**: AI가 추천한 휴리스틱 항목 확인 및 조정
4. **화면 추가**: 프로젝트 상세 페이지에서 스크린샷 업로드 및 화면 정보 입력
5. **평가 실행**: AI가 자동으로 UX 분석 수행
6. **결과 확인**: 카테고리별 점수, 강점/개선점, 상세 분석 확인
7. **개선 UI 생성**: 평가 결과 기반 개선된 UI 코드 자동 생성

## 프로젝트 구조

```
src/
├── components/ui/     # 재사용 UI 컴포넌트 (Button, Card, Input 등)
├── lib/
│   ├── supabase.ts    # Supabase 클라이언트 및 DB 함수
│   ├── evaluation.ts  # AI 평가 로직
│   └── uiImprovement.ts # 개선 UI 생성 로직
├── pages/
│   ├── NewProjectPage.tsx      # 프로젝트 생성
│   ├── ProjectDetailPage.tsx   # 프로젝트 상세/화면 관리
│   └── EvaluationResultPage.tsx # 평가 결과 확인
├── App.tsx            # 라우팅 및 홈페이지
└── main.tsx           # 앱 엔트리포인트
```

## 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
npm run preview  # 빌드 결과 미리보기
```

## 타겟 사용자

- UX 디자이너
- 프로덕트 매니저
- 초보 바이브 코더

## 라이선스

MIT License
