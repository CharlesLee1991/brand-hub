# 🚀 Brand Hub 배포 가이드 (v2.0)

## 변경 사항 요약

### 새 Edge Functions
1. **geobh-eeat** (신규) — EEAT 분석 데이터 API
   - `?slug=samsung-hospital` → 분석 상세 + 페이지별 점수 + 컴플라이언스
   - `?partner_code=BH_HAMSOUT` → 파트너별 고객사 목록
   - 배포 완료 ✅

2. **geobh-data** (업데이트 v3) — 브랜드허브 설정 API
   - `?list=all` 파라미터 추가 → 전체 허브 목록 (hub_type 포함)
   - 배포 완료 ✅

### Next.js 파일 변경

| 파일 | 변경 | 설명 |
|------|------|------|
| `middleware.ts` | 신규 | 서브도메인 라우팅 (*.bmp.ai → /slug) |
| `app/page.tsx` | 교체 | 메인 랜딩 — DB 기반 동적 파트너 로딩 |
| `app/[tenant]/page.tsx` | 교체 | 테넌트 페이지 — 4탭 UI (개요/EEAT/서비스/채팅) |
| `lib/config.ts` | 교체 | 설정 중앙화 (slug 매핑) |

## 배포 순서

### 1. GitHub 레포에 파일 교체
```bash
cd geocare  # 또는 brand-hub 레포 루트

# 기존 파일 백업
cp middleware.ts middleware.ts.bak 2>/dev/null
cp app/page.tsx app/page.tsx.bak
cp "app/[tenant]/page.tsx" "app/[tenant]/page.tsx.bak"

# 새 파일 복사
cp {다운로드경로}/middleware.ts .
cp {다운로드경로}/app/page.tsx app/
cp {다운로드경로}/app/[tenant]/page.tsx app/[tenant]/
cp {다운로드경로}/lib/config.ts lib/
```

### 2. 의존성 확인
```bash
# react-markdown이 없으면 설치
npm install react-markdown
# lucide-react 이미 있는지 확인
npm list lucide-react
```

### 3. 로컬 테스트
```bash
npm run dev
# http://localhost:3000 → 메인 랜딩 (4개 파트너 표시)
# http://localhost:3000/hahmshout → 함샤우트 4탭 UI
```

### 4. Vercel 배포
```bash
git add .
git commit -m "feat: Brand Hub v2 - EEAT scorecard, compliance, services, subdomain routing"
git push origin main
# Vercel 자동 배포 트리거
```

### 5. 배포 후 확인
```bash
# 메인
curl -s -o /dev/null -w "%{http_code}" https://bmp.ai

# 파트너 페이지
curl -s -o /dev/null -w "%{http_code}" https://bmp.ai/hahmshout

# 서브도메인 (DNS propagation 후)
curl -s -o /dev/null -w "%{http_code}" https://hahmshout.bmp.ai

# Edge Functions
curl -s "https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-data?list=all"
curl -s "https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-eeat?slug=samsung-hospital"
```

## Vercel 서브도메인 설정 (이미 완료된 경우 스킵)

Vercel Dashboard → Settings → Domains:
- `bmp.ai` (이미 설정)
- `*.bmp.ai` (와일드카드 — 이미 설정)

## 아키텍처

```
사용자 → hahmshout.bmp.ai
  │
  ├→ Vercel (middleware.ts)
  │   └→ URL rewrite: / → /hahmshout
  │
  ├→ app/[tenant]/page.tsx
  │   ├→ geobh-data?slug=hahmshout  (브랜드 설정)
  │   └→ geobh-eeat?slug=samsung-hospital  (EEAT 데이터)
  │
  └→ khub-query (AI 어시스턴트 채팅)
       └→ KHub RAG → BH_HAMSOUT + BH_COMMON 문서
```
