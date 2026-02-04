import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 허용된 테넌트 목록 (DB에서 관리 가능)
const VALID_TENANTS = ['bizspring', 'demo']

// 제외할 호스트 (Vercel 기본 도메인)
const EXCLUDED_HOSTS = [
  'localhost',
  'vercel.app',
  'bizsmart.co.kr', // 루트 도메인 제외
]

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  
  // 정적 파일, API 라우트 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Vercel 기본 도메인이나 localhost는 패스
  if (EXCLUDED_HOSTS.some(h => hostname.includes(h))) {
    return NextResponse.next()
  }

  // 서브도메인 추출: bizspring.bizsmart.co.kr → bizspring
  const subdomain = hostname.split('.')[0]
  
  // 유효한 테넌트인지 확인
  if (subdomain && VALID_TENANTS.includes(subdomain)) {
    // 서브도메인을 URL 경로로 리라이트
    // bizspring.bizsmart.co.kr/geo_consulting → /bizspring/geo_consulting
    const url = request.nextUrl.clone()
    url.pathname = `/${subdomain}${pathname}`
    
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // 정적 파일 제외
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
