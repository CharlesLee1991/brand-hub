"use client"

import { useState } from "react"
import Link from "next/link"

const CLIENTS = [
  { slug: "samsung-hospital", label: "삼성서울병원", partner: "hahmshout" },
  { slug: "taxtok", label: "택스톡", partner: "hahmshout" },
  { slug: "shoppingnt", label: "쇼핑앤티몰", partner: "mplatit" },
  { slug: "yedaham", label: "예다함", partner: "hahmshout" },
]

const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1"

export default function DemoPage() {
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const accent = "#2563eb"

  const runQuickScan = async (targetSlug: string) => {
    setLoading(true); setResult(null)
    try {
      const [eeatRes, somRes] = await Promise.allSettled([
        fetch(BAWEE_EF + "/geobh-eeat-report?slug=" + targetSlug + "&format=json").then(r => r.json()),
        fetch(BAWEE_EF + "/geobh-som?slug=" + targetSlug).then(r => r.json()),
      ])
      const eeat = eeatRes.status === "fulfilled" ? eeatRes.value : null
      const som = somRes.status === "fulfilled" ? somRes.value : null
      const client = CLIENTS.find(c => c.slug === targetSlug)
      setResult({ eeat, som, slug: targetSlug, partner: client?.partner })
    } catch {}
    setLoading(false)
  }

  const sc = result?.eeat?.scorecard

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black" style={{ color: accent }}>GEO</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-900">AI 검색 진단</span>
          </div>
          <Link href="https://bmp.ai" className="text-sm text-gray-500 hover:text-gray-900">bmp.ai →</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            AI가 당신의 브랜드를<br />얼마나 알고 있을까요?
          </h1>
          <p className="text-gray-500">
            ChatGPT, Perplexity, Gemini, Claude가 검색 결과에 브랜드를 어떻게 표현하는지 확인하세요
          </p>
        </div>

        {/* Quick Scan Cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {CLIENTS.map(c => (
            <button key={c.slug}
              onClick={() => { setSlug(c.slug); runQuickScan(c.slug) }}
              disabled={loading}
              className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${slug === c.slug && loading ? "bg-blue-50 border-blue-200" : "bg-white hover:border-gray-300"}`}>
              <p className="font-bold text-gray-900">{c.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.slug}</p>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">AI 검색 환경을 스캔하고 있습니다...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* EEAT */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-gray-700">E-E-A-T 점수</span>
                  {sc && (
                    <span className="px-3 py-1 rounded-full text-sm font-black text-white"
                      style={{ backgroundColor: sc.overall_grade === "A" ? "#10b981" : sc.overall_grade === "B" ? "#3b82f6" : "#f59e0b" }}>
                      {sc.overall_grade}등급 · {sc.overall_score}점
                    </span>
                  )}
                </div>
                {sc ? (
                  <div className="space-y-2.5">
                    {[
                      { label: "경험(Experience)", score: sc.experience?.score, color: "#f59e0b" },
                      { label: "전문성(Expertise)", score: sc.expertise?.score, color: "#3b82f6" },
                      { label: "권위(Authority)", score: sc.authoritativeness?.score, color: "#8b5cf6" },
                      { label: "신뢰(Trust)", score: sc.trustworthiness?.score, color: "#10b981" },
                    ].map(a => (
                      <div key={a.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">{a.label}</span>
                          <span className="font-bold" style={{ color: a.color }}>{a.score}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all" style={{ width: (a.score || 0) + "%", backgroundColor: a.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">데이터 없음</p>}
              </div>

              {/* SoM */}
              <div className="bg-white rounded-xl border p-6">
                <span className="text-sm font-bold text-gray-700">AI 검색 점유율</span>
                {result.som?.latest ? (
                  <div className="mt-4 text-center">
                    <p className="text-4xl font-black" style={{ color: accent }}>{result.som.latest.overall_share}%</p>
                    <p className="text-sm text-gray-500 mt-1">AI 검색에서 언급되는 비율</p>
                    <div className="grid grid-cols-3 gap-3 mt-5 text-xs">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="font-bold text-gray-900">{result.som.latest.avg_rank}</p>
                        <p className="text-gray-500">평균 순위</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="font-bold text-gray-900">{result.som.latest.top3_rate}%</p>
                        <p className="text-gray-500">Top3 비율</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="font-bold text-gray-900">{result.som.latest.total_queries}</p>
                        <p className="text-gray-500">분석 질의</p>
                      </div>
                    </div>
                  </div>
                ) : <p className="text-sm text-gray-400 mt-4">데이터 없음</p>}
              </div>
            </div>

            {/* CTA */}
            {result.partner && (
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-center text-white">
                <p className="font-bold text-lg mb-2">전체 리포트 + AI 콘텐츠 생성</p>
                <p className="text-blue-100 text-sm mb-4">
                  Citation Moat™ 분석, EEAT 컴플라이언스, 콘텐츠 랩까지 — 전체 브랜드허브에서 확인하세요
                </p>
                <Link href={"/" + result.partner + "/" + result.slug}
                  className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:shadow-lg transition-all">
                  브랜드허브 열기 →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Bottom pitch */}
        {!result && !loading && (
          <div className="text-center mt-16 text-gray-400 text-sm">
            <p>위 브랜드 중 하나를 선택하면 즉시 AI 진단이 시작됩니다</p>
            <p className="mt-1">내 브랜드 진단이 필요하다면 → <a href="mailto:charles@bizspring.co.kr" className="text-blue-600 hover:underline">문의하기</a></p>
          </div>
        )}
      </main>
    </div>
  )
}
