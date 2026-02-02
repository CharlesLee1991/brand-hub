# Brand Hub

GEOcare와 연동된 AI 기반 브랜드 지식 허브 플랫폼입니다.

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 Supabase 키를 설정하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인하세요.

## 📦 Vercel 배포

### CLI로 바로 배포 (GitHub 없이)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 환경 변수 설정

Vercel 대시보드 또는 CLI에서 설정:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 🏗️ 프로젝트 구조

```
brand-hub/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 랜딩 페이지
│   ├── globals.css         # 글로벌 스타일
│   └── [tenant]/
│       └── page.tsx        # 테넌트별 AI 어시스턴트
├── lib/
│   └── supabase.ts         # Supabase 클라이언트
├── vercel.json             # Vercel 설정 (서울 리전)
└── package.json
```

## 🔗 연동 시스템

- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenAI GPT-4o-mini + RAG 파이프라인
- **Knowledge Base**: Notion 데이터베이스
- **Hosting**: Vercel (서울 리전)

## 📋 파일럿 파트너

| 파트너 | 코드 | URL |
|--------|------|-----|
| 엠피알디 | `mprd` | `/mprd` |
| 함샤우트글로벌 | `hamshout` | `/hamshout` |

## 📄 라이선스

© 2025 GEOcare. All rights reserved.
