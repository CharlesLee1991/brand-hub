'use client'

import { useState } from "react"

// 삼성서울병원 심장내과 - 실제 API 응답 데이터
const REAL_API_DATA = {
  url: "samsunghospital.com/dept/cardio",
  scores: { experience: 3.0, expertise: 4.0, authoritativeness: 4.0, trustworthiness: 3.0, total: 70 },
  gaps: {
    experience: ["환자 후기나 경험담이 없음", "센터의 치료 성과나 사례에 대한 구체적 정보 부족"],
    expertise: ["전문 의료진의 자격증이나 경력 정보 부족", "진료 방법에 대한 구체적 설명 부족"],
    trustworthiness: ["환자 후기나 추천사 부족", "센터의 신뢰성을 높일 수 있는 외부 인증 정보 부족"],
    authoritativeness: ["센터의 인증이나 수상 내역에 대한 정보 부족", "연구 결과나 임상 데이터에 대한 언급 부족"]
  },
  suggested_faqs: [
    { question: "협심증의 주요 증상은 무엇인가요?", target_keyword: "협심증 증상", answer_direction: "가슴 통증, 호흡 곤란, 피로감 등 증상 설명" },
    { question: "심근경색 치료는 어떻게 이루어지나요?", target_keyword: "심근경색 치료 방법", answer_direction: "약물요법, 중재적 시술, 수술 방법 설명" },
    { question: "응급 상황에서 어떻게 대처해야 하나요?", target_keyword: "심장 응급처치", answer_direction: "응급처치 방법 및 병원 연락처 안내" }
  ],
  content_brief: {
    tone: "전문적이면서도 친근한, 데이터 기반",
    new_sections: [
      { heading: "H2: 환자 후기", key_points: ["실제 환자들의 치료 경험 및 후기", "센터의 서비스 품질에 대한 평가"], estimated_words: 300 },
      { heading: "H2: 전문 의료진 소개", key_points: ["센터장 및 주요 의료진의 경력과 전문 분야", "의료진의 연구 및 학술 활동"], estimated_words: 300 },
      { heading: "H2: 치료 성과 및 사례", key_points: ["센터의 치료 성과 통계", "환자 사례 및 성공적인 치료 이야기"], estimated_words: 300 },
      { heading: "H2: 인증 및 수상 내역", key_points: ["센터의 인증 및 수상 내역", "신뢰성을 높이는 정보"], estimated_words: 200 },
      { heading: "H2: 자주 묻는 질문(FAQ)", key_points: ["환자들이 자주 묻는 질문과 답변"], estimated_words: 300 }
    ],
    priority_keywords: ["협심증", "심근경색", "심장 치료", "전문 의료진"],
    total_additional_words: 1500
  },
  schema_recommendations: [
    { type: "FAQPage", reason: "Featured Snippet 획득 가능" },
    { type: "MedicalOrganization", reason: "검색 엔진 최적화" }
  ]
}

const GENERATED_CONTENT: Record<string, string> = {
  blog: `## 삼성서울병원 심장내과 — 환자가 알아야 할 모든 것

삼성서울병원 심장내과는 연간 15,000건 이상의 심장 시술을 수행하며, 
국내 최고 수준의 심혈관 질환 전문 진료를 제공하고 있습니다.

### 전문 의료진 소개
김○○ 교수 (센터장)
- 서울대학교 의과대학 졸업, 미국 Mayo Clinic 연수
- 심장중재시술 전문, 논문 120편 이상
- 대한심장학회 우수논문상 수상

### 환자 치료 사례
"협심증으로 3개월간 고통받다 삼성서울병원을 찾았습니다. 
김 교수님의 정확한 진단과 스텐트 시술로 현재 정상 생활을..."

### 자주 묻는 질문
**Q. 협심증의 주요 증상은 무엇인가요?**
가슴 중앙의 압박감이나 조이는 듯한 통증이 대표적입니다. 
운동이나 스트레스 시 악화되고 휴식 시 호전되는 특징이 있습니다...`,

  faq_html: `<!-- FAQPage Schema + HTML -->
<div itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" 
       itemtype="https://schema.org/Question">
    <h3 itemprop="name">
      협심증의 주요 증상은 무엇인가요?
    </h3>
    <div itemscope itemprop="acceptedAnswer" 
         itemtype="https://schema.org/Answer">
      <p itemprop="text">
        가슴 중앙의 압박감이나 조이는 듯한 통증이 
        대표적입니다. 운동이나 스트레스 시 악화되고 
        휴식 시 호전되는 특징이 있습니다. 턱이나 
        왼팔로 통증이 퍼질 수 있으며, 호흡 곤란이나 
        식은땀이 동반될 수 있습니다.
      </p>
    </div>
  </div>
</div>`,

  jsonld: `{
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  "name": "삼성서울병원 심장내과",
  "medicalSpecialty": "Cardiology",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "서울특별시 강남구",
    "streetAddress": "일원로 81"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+82-2-3410-3000",
    "contactType": "예약"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "1250"
  }
}`,

  youtube: `🎬 YouTube 대본 — "심장이 보내는 위험 신호 5가지"

[인트로 — 0:00~0:30]
"가슴이 뻐근한데, 이거 혹시 심장 문제일까요?"
오늘은 삼성서울병원 심장내과 김○○ 교수님과 함께
협심증과 심근경색의 차이, 그리고 응급 대처법을 알아봅니다.

[본론1 — 0:30~3:00] 협심증 vs 심근경색
키워드: 협심증 증상 | 심근경색 치료 방법
- 협심증: 일시적 혈류 감소 → 가슴 통증
- 심근경색: 완전 차단 → 응급 상황

[본론2 — 3:00~5:00] 응급 대처법
키워드: 심장 응급처치
- 119 즉시 호출
- 아스피린 복용 (의사 처방 있는 경우)
- CPR 방법

[아웃트로 — 5:00~5:30]
CTA: "정확한 진단이 필요하시면 삼성서울병원 심장내과 예약"`,

  ad_banner: `🖼️ 광고 배너 카피 (3종)

[배너A — 인지도/신뢰]
헤드라인: "심장 전문의 42명, 연간 15,000건 시술"
서브: 삼성서울병원 심장내과
CTA: 전문의 상담 예약 →
타겟 키워드: 전문 의료진

[배너B — 증상 호소]
헤드라인: "가슴이 답답하고 숨이 차시나요?"
서브: 협심증 조기 발견이 중요합니다
CTA: 무료 상담 신청 →
타겟 키워드: 협심증 증상

[배너C — 긴급/전환]
헤드라인: "심근경색, 골든타임 2시간"
서브: 24시간 응급 심장시술 가능
CTA: 지금 예약하기 →
타겟 키워드: 심근경색 치료 방법`,

  community: `📱 커뮤니티/SNS 포스트 (3종)

[네이버 카페 — 환자 정보형]
제목: 협심증 진단 받고 삼성서울병원 다녀온 후기
"협심증 증상이 뭔지도 몰랐는데, 계단 오를 때마다 
가슴이 답답해서 병원에 갔더니..."
→ gaps 중 "환자 후기" 부족을 해결

[인스타그램 — 카드뉴스]
Slide 1: "심장이 보내는 SOS 신호 알고 계세요?"
Slide 2: "🔴 가슴 압박감 🔴 호흡곤란 🔴 식은땀"
Slide 3: "협심증 vs 심근경색 차이점"
Slide 4: "삼성서울병원 심장내과 상담 예약"
→ priority_keywords 활용

[브런치 — 전문 칼럼]
제목: 심장내과 전문의가 말하는, 협심증 오해와 진실
→ content_brief의 tone + expertise gaps 해소`
}

const CONTENT_TYPES = [
  { id: "blog", icon: "📝", label: "블로그/홈페이지", desc: "content_brief → 섹션별 글 자동 생성" },
  { id: "faq_html", icon: "❓", label: "FAQ 페이지 + Schema", desc: "suggested_faqs → HTML + JSON-LD 코드" },
  { id: "jsonld", icon: "🏗️", label: "JSON-LD 구조화", desc: "schema_recommendations → 검색엔진 코드" },
  { id: "youtube", icon: "🎬", label: "YouTube 대본", desc: "faqs + brief → 영상 스크립트" },
  { id: "ad_banner", icon: "🖼️", label: "광고 배너 카피", desc: "keywords + gaps → 배너 3종" },
  { id: "community", icon: "💬", label: "커뮤니티/SNS", desc: "gaps + faqs → 네이버/인스타/브런치" },
]

const MAPPING_DATA = [
  {
    from: "gaps",
    fromColor: "text-red-400",
    outputs: [
      { type: "홈페이지 섹션 추가", desc: "부족한 점을 채우는 새 섹션" },
      { type: "블로그 주제 도출", desc: "gaps가 곧 블로그 주제" },
      { type: "커뮤니티 후기 유도", desc: "환자 후기 부족 → 후기 캠페인" },
    ]
  },
  {
    from: "suggested_faqs",
    fromColor: "text-yellow-400",
    outputs: [
      { type: "FAQ 페이지 생성", desc: "질문+답변+키워드 세트" },
      { type: "YouTube 대본", desc: "FAQ → 영상 주제" },
      { type: "네이버 지식인 답변", desc: "키워드 기반 질문 답변" },
    ]
  },
  {
    from: "content_brief",
    fromColor: "text-blue-400",
    outputs: [
      { type: "블로그 글 자동 작성", desc: "톤 + 섹션 + 키워드 → AI 생성" },
      { type: "뉴스/보도자료", desc: "톤 + 핵심 포인트 → PR 기사" },
      { type: "브런치/미디어 칼럼", desc: "전문성 있는 장문 콘텐츠" },
    ]
  },
  {
    from: "schema_rec",
    fromColor: "text-purple-400",
    outputs: [
      { type: "JSON-LD 코드", desc: "웹사이트 <head>에 삽입" },
      { type: "리치 스니펫", desc: "구글 검색결과에 별점/FAQ 표시" },
      { type: "AI 엔진 인용 증가", desc: "ChatGPT/Perplexity가 인용" },
    ]
  },
  {
    from: "priority_keywords",
    fromColor: "text-cyan-400",
    outputs: [
      { type: "광고 배너 카피", desc: "키워드 기반 헤드라인" },
      { type: "검색광고(SA)", desc: "키워드 = 광고 타겟팅" },
      { type: "SNS 해시태그", desc: "인스타/유튜브 태그" },
    ]
  }
]

const FLOW_STEPS = [
  { emoji: "🌐", label: "웹사이트\n크롤링", sub: "Firecrawl" },
  { emoji: "🔬", label: "EEAT\n분석", sub: "Claude AI" },
  { emoji: "📊", label: "JSON\n결과", sub: "API 서빙" },
  { emoji: "🤖", label: "생성형AI\n투입", sub: "Claude/GPT" },
  { emoji: "📦", label: "콘텐츠\n7채널", sub: "파트너 실행" },
]

const DATA_SOURCE_MAP: Record<string, string> = {
  blog: "content_brief (톤/섹션/키워드) + gaps (부족한 점) + suggested_faqs",
  faq_html: "suggested_faqs (질문/답변방향/키워드) + schema_recommendations (FAQPage)",
  jsonld: "schema_recommendations (타입/속성) + URL/도메인 정보",
  youtube: "suggested_faqs (주제) + content_brief (톤) + priority_keywords",
  ad_banner: "priority_keywords (타겟팅) + gaps (소구점) + scores (강조할 강점)",
  community: "gaps (해소할 부족점) + suggested_faqs (주제) + content_brief (톤)",
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 4 ? "bg-green-500" : score >= 3 ? "bg-yellow-500" : "bg-red-500"
  const textColor = score >= 4 ? "text-green-400" : score >= 3 ? "text-yellow-400" : "text-red-400"
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-48 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${textColor}`}>{score}</span>
    </div>
  )
}

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("data")
  const [selectedContent, setSelectedContent] = useState<string | null>(null)
  const data = REAL_API_DATA

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">🔬 EEAT Agentic API Demo</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">삼성서울병원 심장내과 · 실제 분석 데이터 기반</p>
          </div>
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← bmp.ai
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "data", label: "① API 응답 데이터" },
            { id: "mapping", label: "② 데이터 → 콘텐츠 매핑" },
            { id: "output", label: "③ 생성 결과물 시연" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedContent(null) }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: API Response Data */}
        {activeTab === "data" && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h2 className="text-lg font-semibold text-blue-400 mb-1">API가 돌려주는 데이터</h2>
              <p className="text-xs text-gray-500 mb-5">
                <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-300">GET /api/results?slug=samsung-hospital</code> → 아래 JSON 반환
              </p>

              {/* Scores */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">📊 EEAT 점수 (총점: <span className="text-yellow-400">{data.scores.total}점</span>)</h3>
                <div className="space-y-2.5">
                  <ScoreBar label="Experience (경험)" score={data.scores.experience} />
                  <ScoreBar label="Expertise (전문성)" score={data.scores.expertise} />
                  <ScoreBar label="Authoritativeness (권위)" score={data.scores.authoritativeness} />
                  <ScoreBar label="Trustworthiness (신뢰)" score={data.scores.trustworthiness} />
                </div>
              </div>

              {/* Gaps */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">🔴 gaps — &quot;뭐가 부족한지&quot;</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(data.gaps).map(([key, items]) => (
                    <div key={key} className="bg-gray-900/60 rounded-lg p-3">
                      <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">{key}</span>
                      {items.map((item, i) => (
                        <p key={i} className="text-xs text-gray-400 mt-1.5 leading-relaxed">• {item}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">💡 suggested_faqs — &quot;만들어야 할 FAQ&quot;</h3>
                <div className="space-y-2">
                  {data.suggested_faqs.map((faq, i) => (
                    <div key={i} className="p-3 bg-gray-900/60 rounded-lg">
                      <p className="text-sm text-white font-medium">Q. {faq.question}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        키워드: <span className="text-green-400 font-medium">{faq.target_keyword}</span>
                        <span className="mx-2 text-gray-700">|</span>
                        방향: {faq.answer_direction}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Brief */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">📝 content_brief — &quot;콘텐츠 제작 가이드&quot;</h3>
                <div className="flex flex-wrap gap-4 mb-3 text-xs">
                  <span className="text-gray-400">톤: <span className="text-blue-400">{data.content_brief.tone}</span></span>
                  <span className="text-gray-400">추가 권장: <span className="text-blue-400">{data.content_brief.total_additional_words}단어</span></span>
                </div>
                <div className="space-y-1 mb-3">
                  {data.content_brief.new_sections.map((sec, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-700/50 last:border-0">
                      <span className="text-xs text-white">{sec.heading}</span>
                      <span className="text-xs text-gray-500">{sec.estimated_words}자</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.content_brief.priority_keywords.map((kw) => (
                    <span key={kw} className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>

              {/* Schema */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">🏗️ schema_recommendations — &quot;검색엔진용 코드&quot;</h3>
                <div className="space-y-2">
                  {data.schema_recommendations.map((sr, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded font-mono">{sr.type}</span>
                      <span className="text-xs text-gray-400">{sr.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Mapping */}
        {activeTab === "mapping" && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h2 className="text-lg font-semibold text-green-400 mb-1">데이터 → 콘텐츠 매핑</h2>
              <p className="text-xs text-gray-500 mb-5">API의 각 JSON 필드가 어떤 콘텐츠로 변환되는지</p>

              <div className="space-y-3">
                {MAPPING_DATA.map((mapping) => (
                  <div key={mapping.from} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 sm:w-40 flex-shrink-0">
                        <span className={`text-sm font-mono font-bold ${mapping.fromColor}`}>{mapping.from}</span>
                        <span className="text-gray-600 hidden sm:inline">→</span>
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {mapping.outputs.map((out) => (
                          <div key={out.type} className="bg-gray-900/60 rounded-lg p-2.5">
                            <p className="text-xs font-medium text-white">{out.type}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{out.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 bg-green-900/20 border border-green-800/30 rounded-lg p-4">
                <p className="text-sm text-green-300 font-medium">💡 핵심 포인트</p>
                <p className="text-xs text-green-200/70 mt-1 leading-relaxed">
                  API 하나로 홈페이지, 블로그, FAQ, YouTube, 광고, 커뮤니티, JSON-LD까지
                  <strong className="text-green-300"> 7가지 채널의 콘텐츠 방향이 자동으로 나옵니다.</strong>
                  {" "}파트너사는 이 &quot;진단서&quot;를 받아서 생성형 AI에 넣기만 하면 됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Generated Content */}
        {activeTab === "output" && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h2 className="text-lg font-semibold text-amber-400 mb-1">생성 결과물 시연</h2>
              <p className="text-xs text-gray-500 mb-4">API 데이터를 AI에 넣으면 나오는 실제 결과물</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => setSelectedContent(ct.id)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      selectedContent === ct.id
                        ? "bg-amber-900/30 border-2 border-amber-500 shadow-lg shadow-amber-500/10"
                        : "bg-gray-800 border-2 border-transparent hover:border-gray-600"
                    }`}
                  >
                    <span className="text-xl">{ct.icon}</span>
                    <p className="text-xs font-medium text-white mt-1.5">{ct.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ct.desc}</p>
                  </button>
                ))}
              </div>

              {selectedContent && (
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  <div className="px-4 py-2.5 border-b border-gray-700 flex items-center justify-between bg-gray-900/70">
                    <span className="text-sm font-medium text-white">
                      {CONTENT_TYPES.find(c => c.id === selectedContent)?.icon}{" "}
                      {CONTENT_TYPES.find(c => c.id === selectedContent)?.label}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">AI 생성 결과 예시</span>
                  </div>
                  <pre className="p-4 text-xs text-gray-300 whitespace-pre-wrap overflow-auto max-h-96 font-mono leading-relaxed">
                    {GENERATED_CONTENT[selectedContent]}
                  </pre>
                  <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                      <span className="text-amber-400 font-medium">사용된 API 데이터:</span>{" "}
                      {DATA_SOURCE_MAP[selectedContent]}
                    </p>
                  </div>
                </div>
              )}

              {!selectedContent && (
                <div className="text-center py-10 text-gray-600">
                  <p className="text-4xl mb-3">👆</p>
                  <p className="text-sm">콘텐츠 유형을 클릭하면 생성 결과를 볼 수 있습니다</p>
                </div>
              )}
            </div>

            {/* Flow Summary */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-white mb-4">🔄 전체 플로우</h3>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                {FLOW_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-gray-800 rounded-lg p-3 w-24 text-center border border-gray-700/50">
                      <span className="text-2xl">{step.emoji}</span>
                      <p className="text-xs text-white mt-1.5 whitespace-pre-line leading-tight font-medium">{step.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{step.sub}</p>
                    </div>
                    {i < FLOW_STEPS.length - 1 && <span className="text-gray-600 text-lg hidden sm:block">→</span>}
                    {i < FLOW_STEPS.length - 1 && <span className="text-gray-600 text-lg sm:hidden">↓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-600">BMP.ai — Powered by GEOcare EEAT Agentic API</p>
          <p className="text-xs text-gray-600">Demo v1.0</p>
        </div>
      </footer>
    </div>
  )
}
