import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// 테넌트별 URL 매핑
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
  // 추후 테넌트 추가
}

interface PageData {
  url: string
  doc_name: string
  document_summary: string
  page_category: string
  geo_score_overall: number
  seo_assets: {
    json_ld?: any
    faq?: Array<{ question: string; answer: string }>
  }
}

// 페이지 데이터 가져오기
async function getPageData(tenant: string, slug: string): Promise<PageData | null> {
  const tenantConfig = TENANT_CONFIG[tenant]
  if (!tenantConfig) return null
  
  const originalUrl = tenantConfig.urls[slug]
  if (!originalUrl) return null

  const { data, error } = await supabase
    .from('geo_gpt_record_manager')
    .select('url, doc_name, document_summary, page_category, geo_score_overall, seo_assets')
    .eq('url', originalUrl)
    .single()

  if (error || !data) return null
  return data as PageData
}

// 정적 경로 생성 (빌드 시)
export async function generateStaticParams() {
  const params: { tenant: string; slug: string[] }[] = []
  
  for (const [tenant, config] of Object.entries(TENANT_CONFIG)) {
    for (const slug of Object.keys(config.urls)) {
      params.push({ tenant, slug: [slug] })
    }
  }
  
  return params
}

// 메타데이터 생성 (SEO)
export async function generateMetadata({ 
  params 
}: { 
  params: { tenant: string; slug: string[] } 
}): Promise<Metadata> {
  const { tenant, slug } = params
  const slugPath = slug?.[0] || ''
  const data = await getPageData(tenant, slugPath)
  
  if (!data) {
    return { title: 'Page Not Found' }
  }

  const tenantConfig = TENANT_CONFIG[tenant]

  return {
    title: data.doc_name,
    description: data.document_summary,
    alternates: {
      canonical: data.url,
    },
    openGraph: {
      title: data.doc_name,
      description: data.document_summary,
      url: data.url,
      siteName: tenantConfig?.name || 'Brand Hub',
      type: 'website',
    },
  }
}

// JSON-LD 구조화 데이터 컴포넌트
function JsonLdScript({ data }: { data: any }) {
  if (!data) return null
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// FAQ 섹션 컴포넌트
function FAQSection({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  if (!faqs || faqs.length === 0) return null

  return (
    <section className="mt-8 p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-4">❓ 자주 묻는 질문</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details key={index} className="bg-white p-4 rounded-lg shadow-sm">
            <summary className="font-medium text-gray-900 cursor-pointer">
              Q. {faq.question}
            </summary>
            <p className="mt-2 text-gray-600 pl-4">
              A. {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

// E-E-A-T 섹션 컴포넌트
function EEATSection({ tenantName }: { tenantName: string }) {
  const today = new Date().toISOString().split('T')[0]
  
  return (
    <section className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">📝 콘텐츠 정보</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Author - Expertise */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg">👤</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{tenantName} 마테크 연구팀</p>
            <p className="text-sm text-gray-600">마케팅 테크놀로지 전문가 그룹</p>
          </div>
        </div>
        
        {/* Last Updated - Experience */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📅</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">최종 업데이트</p>
            <p className="text-sm text-gray-600">{today}</p>
          </div>
        </div>
        
        {/* Verified - Trustworthiness */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg">✅</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">검증된 정보</p>
            <p className="text-sm text-gray-600">전문가 검토 완료</p>
          </div>
        </div>
        
        {/* Authority */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🏢</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{tenantName}</p>
            <p className="text-sm text-gray-600">마테크 솔루션 전문 기업</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// 메인 페이지 컴포넌트
export default async function TenantPage({ 
  params 
}: { 
  params: { tenant: string; slug: string[] } 
}) {
  const { tenant, slug } = params
  const slugPath = slug?.[0] || ''
  
  const tenantConfig = TENANT_CONFIG[tenant]
  if (!tenantConfig) {
    notFound()
  }
  
  const data = await getPageData(tenant, slugPath)
  
  if (!data) {
    notFound()
  }

  const jsonLd = data.seo_assets?.json_ld
  const faqs = data.seo_assets?.faq || []

  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <JsonLdScript data={jsonLd} />
      
      <main className="min-h-screen bg-white">
        {/* 헤더 */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
              <span>{tenantConfig.name}</span>
              <span>›</span>
              <span>{data.page_category}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {data.doc_name}
            </h1>
            <p className="text-blue-100 text-lg">
              {data.document_summary}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-700/50 px-3 py-1 rounded-full">
              <span className="text-yellow-300">⭐</span>
              <span>GEO Score: {data.geo_score_overall}/100</span>
            </div>
          </div>
        </header>

        {/* 본문 */}
        <article className="max-w-4xl mx-auto px-4 py-8">
          {/* 원본 링크 안내 */}
          <div className="mb-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600">
              📌 이 페이지는 AI 검색엔진 최적화된 버전입니다.
              <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:underline"
              >
                원본 페이지 방문 →
              </a>
            </p>
          </div>

          {/* FAQ 섹션 */}
          <FAQSection faqs={faqs} />
          
          {/* E-E-A-T 섹션 */}
          <EEATSection tenantName={tenantConfig.name} />
        </article>

        {/* 푸터 */}
        <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p>© 2025 {tenantConfig.name}. GEO Optimized by Brand Hub.</p>
            <p className="text-sm mt-2">
              Powered by <a href="https://geocare.ai" className="text-blue-400 hover:underline">GEOcare.AI</a>
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
