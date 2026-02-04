import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// 테넌트별 설정
const TENANT_CONFIG: Record<string, { domain: string; name: string; urls: Record<string, string> }> = {
  'bizspring': {
    domain: 'https://bizspring.co.kr',
    name: '비즈스프링',
    urls: {
      'geo_consulting': 'https://bizspring.co.kr/geo_consulting/',
      'smartstore-performance': 'https://bizspring.co.kr/smartstore-performance.php',
      'prd_air': 'https://bizspring.co.kr/prd_air.php',
    }
  },
}

interface PageInfo {
  slug: string
  url: string
  doc_name: string
  document_summary: string
  geo_score_overall: number
}

// 테넌트의 모든 페이지 정보 가져오기
async function getTenantPages(tenant: string): Promise<PageInfo[]> {
  const tenantConfig = TENANT_CONFIG[tenant]
  if (!tenantConfig) return []

  const urls = Object.values(tenantConfig.urls)
  
  const { data, error } = await supabase
    .from('geo_gpt_record_manager')
    .select('url, doc_name, document_summary, geo_score_overall')
    .in('url', urls)
    .order('geo_score_overall', { ascending: false })

  if (error || !data) return []

  // URL을 slug로 매핑
  const urlToSlug = Object.entries(tenantConfig.urls).reduce((acc, [slug, url]) => {
    acc[url] = slug
    return acc
  }, {} as Record<string, string>)

  return data.map(item => ({
    slug: urlToSlug[item.url] || '',
    url: item.url,
    doc_name: item.doc_name,
    document_summary: item.document_summary,
    geo_score_overall: item.geo_score_overall,
  }))
}

// 정적 경로 생성
export async function generateStaticParams() {
  return Object.keys(TENANT_CONFIG).map(tenant => ({ tenant }))
}

// 메타데이터
export async function generateMetadata({ 
  params 
}: { 
  params: { tenant: string } 
}): Promise<Metadata> {
  const tenantConfig = TENANT_CONFIG[params.tenant]
  
  if (!tenantConfig) {
    return { title: 'Not Found' }
  }

  return {
    title: `${tenantConfig.name} - GEO 최적화 페이지`,
    description: `${tenantConfig.name}의 AI 검색엔진 최적화(GEO) 페이지 목록입니다.`,
  }
}

// GEO 점수 배지 색상
function getScoreBadgeColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-blue-100 text-blue-800'
  if (score >= 40) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export default async function TenantIndexPage({ 
  params 
}: { 
  params: { tenant: string } 
}) {
  const { tenant } = params
  const tenantConfig = TENANT_CONFIG[tenant]
  
  if (!tenantConfig) {
    notFound()
  }

  const pages = await getTenantPages(tenant)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {tenantConfig.name}
          </h1>
          <p className="text-blue-100 text-lg">
            AI 검색엔진 최적화(GEO) 페이지
          </p>
          <p className="text-blue-200 text-sm mt-2">
            ChatGPT, Perplexity, Gemini, Claude에서 더 잘 인용되도록 최적화된 콘텐츠
          </p>
        </div>
      </header>

      {/* 페이지 목록 */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          📄 GEO 최적화 페이지 ({pages.length}개)
        </h2>
        
        <div className="grid gap-4">
          {pages.map((page) => (
            <Link 
              key={page.slug}
              href={`/${tenant}/${page.slug}`}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {page.doc_name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {page.document_summary}
                  </p>
                </div>
                <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getScoreBadgeColor(page.geo_score_overall)}`}>
                  GEO {page.geo_score_overall}
                </span>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                원본: {page.url}
              </div>
            </Link>
          ))}
        </div>

        {pages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            등록된 페이지가 없습니다.
          </div>
        )}
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p>© 2025 {tenantConfig.name}. GEO Optimized by Brand Hub.</p>
          <p className="text-sm mt-2">
            Powered by <a href="https://geocare.ai" className="text-blue-400 hover:underline">GEOcare.AI</a>
          </p>
        </div>
      </footer>
    </main>
  )
}
