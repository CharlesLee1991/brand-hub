"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";
const SUPABASE_URL = "https://nntuztaehnywdbttrajy.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udHV6dGFlaG55d2RidHRyYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODg3MzEsImV4cCI6MjA2MzU2NDczMX0.RR8VBYOj8THFQhYh5wQ0SsJj5t7nlHjbx7boFa3VlFg";

interface ClientData {
  client_name: string;
  client_slug: string;
  client_url: string | null;
  client_industry: string | null;
  site_mode: string;
  gamma_site_url: string | null;
}

function getSlugFromHost(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host.endsWith(".bmp.ai") && host.split(".").length === 3) {
    return host.split(".")[0];
  }
  if (host.endsWith(".vercel.app") && host.split(".").length >= 3) {
    return host.split(".")[0];
  }
  return null;
}

// ─── Score Ring ───
function ScoreRing({ score, grade, size = 120 }: { score: number; grade: string; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8} stroke="#e5e7eb" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8} stroke={color}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      <g className="transform rotate-90" style={{ transformOrigin: "center" }}>
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" className="text-2xl font-bold" fill="#1f2937">{score}</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" className="text-sm font-semibold" fill={color}>{grade}</text>
      </g>
    </svg>
  );
}

// ─── Pill Badge ───
function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-800">{value}</span>
    </div>
  );
}

// ─── Main Page ───
export default function SitePage() {
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState<string | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = searchParams.get("slug") || getSlugFromHost();
    setSlug(s);
    if (!s) {
      setError("no-slug");
      setLoading(false);
      return;
    }

    // Fetch client info
    fetch(`${SUPABASE_URL}/rest/v1/bmp_partner_clients?client_slug=eq.${s}&status=eq.active&select=client_name,client_slug,client_url,client_industry,site_mode,gamma_site_url&limit=1`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.[0]) { setError("not-found"); setLoading(false); return; }
        const c = data[0] as ClientData;
        setClient(c);

        // Mode check
        if (c.site_mode === "gamma" && c.gamma_site_url) {
          window.location.href = c.gamma_site_url;
          return;
        }
        if (c.site_mode === "disabled" || (!c.site_mode)) {
          setError("disabled");
          setLoading(false);
          return;
        }

        // brandhub mode → load GEO data
        fetch(`${BAWEE_EF}/geobh-geo-report?slug=${s}&format=json`)
          .then((r) => r.ok ? r.json() : null)
          .then(setReport)
          .catch(() => null)
          .finally(() => setLoading(false));
      })
      .catch(() => { setError("fetch-error"); setLoading(false); });
  }, [searchParams]);

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Gamma redirect (shows briefly) ───
  if (client?.site_mode === "gamma") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <p className="text-gray-500">리다이렉트 중...</p>
      </div>
    );
  }

  // ─── Error states ───
  if (error === "disabled" && client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{client.client_name}</h1>
        <p className="text-gray-500 mb-8">허브사이트가 준비 중입니다.</p>
        {client.client_url && (
          <a href={client.client_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            공식 웹사이트 방문 →
          </a>
        )}
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <p className="text-gray-400">페이지를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // ─── Brand Hub Landing Page ───
  const p = report?.pillars || {};
  const geoScore = report?.authority_index || 0;
  const geoGrade = report?.authority_grade || "-";
  const brandName = client.client_name;
  const industry = client.client_industry || "";
  const siteUrl = client.client_url || "";

  const NAV = ["소개", "서비스", "GEO 분석", "인사이트", "문의"];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{brandName.charAt(0)}</span>
            </div>
            <span className="font-bold text-lg">{brandName}</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {NAV.map((item) => (
              <a key={item} href={`#${item}`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{item}</a>
            ))}
          </div>
          {siteUrl && (
            <a href={siteUrl} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              공식 사이트
            </a>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section id="소개" className="pt-32 pb-20 px-6 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              AI 검색 최적화 모니터링 중
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              {brandName}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                GEO 브랜드 허브
              </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              AI 검색엔진(ChatGPT, Perplexity, Google AI 등)에서
              {brandName}의 브랜드 권위도를 실시간으로 모니터링하고 최적화합니다.
              {industry && ` ${industry} 업계 최고의 AI 검색 가시성을 목표로 합니다.`}
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#GEO 분석" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                GEO 진단 결과 보기
              </a>
              <a href="#문의" className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                상담 신청
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-3xl blur-3xl opacity-30" />
              <div className="relative bg-white rounded-2xl shadow-xl p-8 text-center">
                <p className="text-sm font-medium text-gray-500 mb-4">GEO Authority Index™</p>
                <div className="flex justify-center mb-4">
                  <ScoreRing score={geoScore} grade={geoGrade} size={160} />
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Pill label="EEAT" value={`${p.eeat?.score ?? "-"}`} color="bg-blue-500" />
                  <Pill label="SoM" value={`${p.som?.share ?? 0}%`} color="bg-indigo-500" />
                  <Pill label="Moat" value={`${p.citation_moat?.score ?? 0}`} color="bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="서비스" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">AI 검색 최적화 서비스</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              AI 검색엔진에서 브랜드가 정확하고 긍정적으로 인용되도록 체계적으로 관리합니다.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🔍", title: "E-E-A-T 최적화", desc: "경험, 전문성, 권위성, 신뢰성을 구조적으로 강화하여 AI 엔진의 브랜드 평가를 높입니다." },
              { icon: "📊", title: "AI 검색 점유율 (SoM)", desc: "ChatGPT, Perplexity, Google AI 등에서 브랜드가 얼마나 자주 언급되는지 실시간 추적합니다." },
              { icon: "🏰", title: "Citation Moat 구축", desc: "AI 엔진이 반복 인용하는 신뢰 소스를 구축하여 경쟁사가 쉽게 넘을 수 없는 해자를 만듭니다." },
              { icon: "🔗", title: "구조화 데이터 (JSON-LD)", desc: "Schema.org 기반 구조화 데이터를 설치하여 AI 엔진이 브랜드를 정확하게 이해하도록 합니다." },
              { icon: "📝", title: "AI 최적화 콘텐츠", desc: "블로그, FAQ, YouTube 대본 등 AI 엔진이 학습하기 좋은 콘텐츠를 전문가가 제작합니다." },
              { icon: "📈", title: "월간 GEO 리포트", desc: "매월 Authority Index, SoM 변동, 개선 성과를 정리하여 경영진에게 보고 가능한 리포트를 제공합니다." },
            ].map((s) => (
              <div key={s.title} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <span className="text-3xl">{s.icon}</span>
                <h3 className="text-lg font-bold mt-4 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GEO Analysis ── */}
      {report && (
        <section id="GEO 분석" className="py-20 px-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">GEO 진단 현황</h2>
              <p className="text-gray-600">{brandName}의 AI 검색 최적화 5대 지표</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "EEAT", score: p.eeat?.score, grade: p.eeat?.grade, color: "from-blue-500 to-blue-600" },
                { label: "SoM", score: p.som?.share != null ? p.som.share : p.som?.score, grade: null, color: "from-indigo-500 to-indigo-600" },
                { label: "Citation Moat", score: p.citation_moat?.score, grade: p.citation_moat?.grade, color: "from-emerald-500 to-emerald-600" },
                { label: "컴플라이언스", score: p.compliance?.score, grade: null, color: "from-amber-500 to-amber-600" },
                { label: "경쟁 우위", score: p.competitive?.self_share != null ? Math.round(p.competitive.self_share) : null, grade: null, color: "from-rose-500 to-rose-600" },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl p-5 text-center shadow-sm">
                  <p className="text-xs text-gray-500 mb-2">{kpi.label}</p>
                  <p className={`text-3xl font-bold bg-gradient-to-r ${kpi.color} text-transparent bg-clip-text`}>
                    {kpi.score ?? "-"}{kpi.label === "SoM" || kpi.label === "경쟁 우위" ? "%" : ""}
                  </p>
                  {kpi.grade && <p className="text-xs text-gray-400 mt-1">{kpi.grade}등급</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Insights ── */}
      <section id="인사이트" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">AI 검색 시대의 인사이트</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
              <h3 className="text-xl font-bold mb-4">왜 GEO가 필요한가?</h3>
              <p className="text-blue-100 leading-relaxed">
                2026년 현재, 소비자의 40% 이상이 AI 검색엔진으로 구매 의사결정을 합니다.
                기존 SEO만으로는 AI 검색 결과에 노출되기 어렵습니다.
                GEO(Generative Engine Optimization)는 AI 엔진이 브랜드를 정확히 인식하고
                추천하도록 최적화하는 새로운 마케팅 전략입니다.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4">GEOcare.AI 플랫폼</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                비즈스프링의 GEOcare.AI는 AI 검색 최적화를 위한 올인원 SaaS 플랫폼입니다.
                5대 KPI 자동 진단, 실시간 모니터링, AI 기반 액션플랜 생성까지
                데이터 기반으로 GEO 전략을 실행합니다.
              </p>
              <a href="https://geocare.ai" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline">
                GEOcare.AI 알아보기 →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="문의" className="py-20 px-6 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">AI 검색에서 브랜드를 지키세요</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            {brandName}의 GEO 최적화 전략이 궁금하시다면 전문 컨설턴트와 상담하세요.
            무료 진단 리포트를 제공해 드립니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://geocare.ai" target="_blank" rel="noopener noreferrer"
              className="px-8 py-3 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-colors">
              무료 진단 받기
            </a>
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                className="px-8 py-3 border-2 border-white/40 text-white font-medium rounded-lg hover:bg-white/10 transition-colors">
                {brandName} 공식 사이트
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{brandName}</span>
            <span className="text-xs">GEO 브랜드 허브</span>
          </div>
          <div className="text-xs text-center">
            Powered by <a href="https://geocare.ai" className="text-blue-400 hover:underline">GEOcare.AI</a>
            {" "}· <a href="https://bmp.ai" className="text-blue-400 hover:underline">bmp.ai</a>
            {" "}· © 2026 BizSpring Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
