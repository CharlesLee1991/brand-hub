"use client"

import { useState } from "react"

const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1"

const SLUGS = [
  { slug: "samsung-hospital", label: "삼성서울병원", partner: "hahmshout" },
  { slug: "taxtok", label: "택스톡", partner: "hahmshout" },
  { slug: "shoppingnt", label: "쇼핑앤티몰", partner: "mplatit" },
  { slug: "yedaham", label: "예다함", partner: "hahmshout" },
]

const CONTENT_TYPES = [
  { key: "blog", label: "블로그/홈페이지", icon: "📝", desc: "EEAT 기반 SEO 콘텐츠", recommended: "claude" },
  { key: "faq", label: "FAQ + Schema", icon: "❓", desc: "구조화 FAQ + JSON-LD", recommended: "claude" },
  { key: "youtube", label: "YouTube 대본", icon: "🎬", desc: "영상 스크립트 + 타임라인", recommended: "gpt" },
  { key: "ad", label: "광고 배너 카피", icon: "📢", desc: "헤드라인 + CTA 3종", recommended: "gpt" },
  { key: "community", label: "커뮤니티/SNS", icon: "💬", desc: "네이버/인스타/브런치", recommended: "gemini" },
  { key: "jsonld", label: "JSON-LD 구조화", icon: "🔗", desc: "Schema.org 코드 생성", recommended: "claude" },
]

const LLMS = [
  { key: "claude", name: "Claude", color: "#d97706", strengths: "장문 · 구조화 · 한국어" },
  { key: "gpt", name: "GPT-4o", color: "#10a37f", strengths: "대화체 · 스크립트 · 카피" },
  { key: "gemini", name: "Gemini 2.5", color: "#4285f4", strengths: "트렌드 · 캐주얼 · 빠른 생성" },
]

type DiagResult = { eeat: any; moat: string; som: any }

export default function DemoPage() {
  const [slug, setSlug] = useState("samsung-hospital")
  const [diagLoading, setDiagLoading] = useState(false)
  const [diagResult, setDiagResult] = useState<DiagResult | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedLlm, setSelectedLlm] = useState<string | null>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genResult, setGenResult] = useState<any>(null)
  const [genHistory, setGenHistory] = useState<any[]>([])
  const accent = "#2563eb"

  const runDiag = async () => {
    setDiagLoading(true)
    setDiagResult(null); setGenResult(null); setGenHistory([]); setSelectedType(null); setSelectedLlm(null)
    try {
      const [eeatRes, moatRes, somRes] = await Promise.allSettled([
        fetch(BAWEE_EF + "/geobh-eeat-report?slug=" + slug + "&format=json").then(r => r.json()),
        fetch(BAWEE_EF + "/geobh-moat-report?slug=" + slug).then(r => r.text()),
        fetch(BAWEE_EF + "/geobh-som?slug=" + slug).then(r => r.json()),
      ])
      setDiagResult({
        eeat: eeatRes.status === "fulfilled" ? eeatRes.value : null,
        moat: moatRes.status === "fulfilled" ? moatRes.value : "",
        som: somRes.status === "fulfilled" ? somRes.value : null,
      })
    } catch { /* ignore */ }
    setDiagLoading(false)
  }

  const runGen = async (llmOverride?: string) => {
    const llm = llmOverride || selectedLlm
    if (!selectedType || !llm) return
    setGenLoading(true); setGenResult(null)
    try {
      const res = await fetch(BAWEE_EF + "/geobh-content-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content_type: selectedType, llm }),
      })
      const data = await res.json()
      setGenResult(data)
      if (data.success) setGenHistory(prev => [...prev, data])
    } catch { /* ignore */ }
    setGenLoading(false)
  }

  const sc = diagResult?.eeat?.scorecard

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black" style={{ color: accent }}>GEO</span>
            <span className="text-gray-400">×</span>
            <span className="text-xl font-black text-gray-900">Content Lab</span>
          </div>
          <a href="https://bmp.ai" target="_blank" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">bmp.ai →</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* STEP 1: 진단 */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            <h2 className="text-lg font-bold text-gray-900">브랜드 진단</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4 ml-9">AI 검색 환경에서 이 브랜드의 현재 상태를 분석합니다</p>
          <div className="flex gap-3 ml-9">
            <select value={slug} onChange={e => setSlug(e.target.value)}
              className="border rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SLUGS.map(s => (<option key={s.slug} value={s.slug}>{s.label} ({s.slug})</option>))}
            </select>
            <button onClick={runDiag} disabled={diagLoading}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: accent }}>
              {diagLoading ? "분석 중..." : "진단 실행"}
            </button>
          </div>
        </section>

        {/* 진단 결과 */}
        {diagResult && (
          <section className="ml-9">
            <div className="grid md:grid-cols-3 gap-4">
              {/* EEAT */}
              <div className="bg-white rounded-xl border p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-700">E-E-A-T</span>
                  {sc && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black text-white"
                      style={{ backgroundColor: sc.overall_grade === "A" ? "#10b981" : sc.overall_grade === "B" ? "#3b82f6" : "#f59e0b" }}>
                      {sc.overall_grade} · {sc.overall_score}
                    </span>
                  )}
                </div>
                {sc ? (
                  <div className="space-y-2">
                    {[
                      { label: "Experience", score: sc.experience?.score, color: "#f59e0b" },
                      { label: "Expertise", score: sc.expertise?.score, color: "#3b82f6" },
                      { label: "Authority", score: sc.authoritativeness?.score, color: "#8b5cf6" },
                      { label: "Trust", score: sc.trustworthiness?.score, color: "#10b981" },
                    ].map(a => (
                      <div key={a.label}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-gray-500">{a.label}</span>
                          <span className="font-bold" style={{ color: a.color }}>{a.score}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: (a.score || 0) + "%", backgroundColor: a.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">데이터 없음</p>}
              </div>

              {/* SoM */}
              <div className="bg-white rounded-xl border p-5">
                <span className="text-sm font-bold text-gray-700">SoM 점유율</span>
                {diagResult.som?.latest ? (
                  <div className="mt-3 space-y-3">
                    <div className="text-center">
                      <p className="text-3xl font-black" style={{ color: accent }}>{diagResult.som.latest.overall_share}%</p>
                      <p className="text-xs text-gray-500">AI 검색 점유율</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-gray-900">{diagResult.som.latest.avg_rank}</p>
                        <p className="text-gray-500">평균 순위</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-gray-900">{diagResult.som.latest.top3_rate}%</p>
                        <p className="text-gray-500">Top3</p>
                      </div>
                    </div>
                  </div>
                ) : <p className="text-sm text-gray-400 mt-3">데이터 없음</p>}
              </div>

              {/* Citation Moat */}
              <div className="bg-white rounded-xl border p-5">
                <span className="text-sm font-bold text-gray-700">Citation Moat™</span>
                {diagResult.moat ? (
                  <div className="mt-3">
                    <button onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(diagResult.moat); w.document.close() } }}
                      className="w-full py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      HTML 리포트 보기 →
                    </button>
                    <p className="text-xs text-gray-400 mt-2 text-center">AI 인용 패턴 분석</p>
                  </div>
                ) : <p className="text-sm text-gray-400 mt-3">데이터 없음</p>}
              </div>
            </div>
          </section>
        )}

        {/* STEP 2: 콘텐츠 유형 */}
        {diagResult && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="text-lg font-bold text-gray-900">콘텐츠 유형 선택</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4 ml-9">EEAT 분석 결과를 바탕으로 어떤 콘텐츠를 생성할지 선택하세요</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 ml-9">
              {CONTENT_TYPES.map(ct => {
                const isSelected = selectedType === ct.key
                const recLlm = LLMS.find(l => l.key === ct.recommended)
                return (
                  <button key={ct.key}
                    onClick={() => { setSelectedType(ct.key); setSelectedLlm(ct.recommended); setGenResult(null) }}
                    className={"p-4 rounded-xl border text-left transition-all " + (isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "bg-white hover:border-gray-300")}>
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{ct.icon}</span>
                      {recLlm && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: recLlm.color }}>
                          {recLlm.name} 추천
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 mt-2">{ct.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ct.desc}</p>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* STEP 3: LLM + 생성 */}
        {selectedType && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <h2 className="text-lg font-bold text-gray-900">AI 엔진 선택 + 생성</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4 ml-9">같은 프롬프트로 다른 AI 결과를 비교해보세요</p>
            <div className="flex gap-3 items-center ml-9 flex-wrap">
              {LLMS.map(llm => {
                const isRec = CONTENT_TYPES.find(c => c.key === selectedType)?.recommended === llm.key
                const isSelected = selectedLlm === llm.key
                return (
                  <button key={llm.key}
                    onClick={() => { setSelectedLlm(llm.key); setGenResult(null) }}
                    className={"flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-all " + (isSelected ? "border-2 shadow-sm" : "bg-white hover:border-gray-300")}
                    style={isSelected ? { borderColor: llm.color, backgroundColor: llm.color + "08" } : {}}>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: llm.color }} />
                    <span className="font-bold text-gray-900">{llm.name}</span>
                    {isRec && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">추천</span>}
                  </button>
                )
              })}
              <button onClick={() => runGen()} disabled={genLoading || !selectedLlm}
                className="ml-auto px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: LLMS.find(l => l.key === selectedLlm)?.color || accent }}>
                {genLoading ? "생성 중... (10~20초)" : "🚀 콘텐츠 생성"}
              </button>
            </div>
            {selectedLlm && (
              <p className="text-xs text-gray-400 ml-9 mt-2">{LLMS.find(l => l.key === selectedLlm)?.name} 특성: {LLMS.find(l => l.key === selectedLlm)?.strengths}</p>
            )}
          </section>
        )}

        {/* 생성 로딩 */}
        {genLoading && (
          <div className="ml-9 bg-white rounded-xl border p-8 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">{LLMS.find(l => l.key === selectedLlm)?.name}이 콘텐츠를 생성하고 있습니다...</span>
          </div>
        )}

        {/* 생성 결과 */}
        {genResult?.success && (
          <section className="ml-9 space-y-4">
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: LLMS.find(l => l.key === genResult.llm)?.color }} />
                  <span className="text-sm font-bold text-gray-900">{genResult.llm_model}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-sm text-gray-600">{genResult.content_label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{(genResult.elapsed_ms / 1000).toFixed(1)}s</span>
                  <span className="text-xs text-gray-400">{genResult.content?.length?.toLocaleString()}자</span>
                  <button onClick={() => navigator.clipboard.writeText(genResult.content)}
                    className="text-xs px-2.5 py-1 rounded border hover:bg-gray-100 text-gray-600">복사</button>
                </div>
              </div>
              <div className="p-5 max-h-[500px] overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">{genResult.content}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">다른 AI로 비교:</span>
              {LLMS.filter(l => l.key !== genResult.llm).map(llm => (
                <button key={llm.key} onClick={() => { setSelectedLlm(llm.key); setTimeout(() => runGen(llm.key), 50) }}
                  disabled={genLoading}
                  className="text-xs px-3 py-1.5 rounded-lg border hover:shadow-sm transition-all flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: llm.color }} />
                  {llm.name}으로 생성
                </button>
              ))}
            </div>
          </section>
        )}

        {genResult && !genResult.success && (
          <div className="ml-9 bg-red-50 rounded-xl border border-red-200 p-5">
            <p className="text-sm text-red-700">오류: {genResult.error}</p>
          </div>
        )}

        {/* 비교 히스토리 */}
        {genHistory.length > 1 && (
          <section className="ml-9">
            <h3 className="text-sm font-bold text-gray-700 mb-3">📊 생성 비교 ({genHistory.length}건)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm bg-white rounded-xl border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">AI 엔진</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">콘텐츠 유형</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-600">시간</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-600">글자수</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {genHistory.map((h, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LLMS.find(l => l.key === h.llm)?.color }} />
                        <span className="font-medium">{h.llm_model}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{h.content_label}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{(h.elapsed_ms / 1000).toFixed(1)}s</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{h.content?.length?.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => setGenResult(h)} className="text-xs text-blue-600 hover:underline">보기</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-gray-400 pt-10 pb-6 border-t">
          <p>GEOcare.AI × BMP.ai Content Lab</p>
          <p className="mt-1">EEAT 분석 → AI 콘텐츠 생성 → LLM 비교 실험</p>
        </footer>
      </main>
    </div>
  )
}
