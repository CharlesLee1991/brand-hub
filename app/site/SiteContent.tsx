"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nntuztaehnywdbttrajy.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

interface ClientData {
  client_name: string;
  client_slug: string;
  client_url: string | null;
  client_industry: string | null;
  site_mode: string;
  gamma_site_url: string | null;
}

interface BrandConfig {
  brand_name: string;
  brand_description: string;
  primary_color: string;
  logo_url: string | null;
  site_domain: string;
}

interface FaqItem { question: string; answer: string; }

function getSlugFromHost(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host.endsWith(".bmp.ai") && host.split(".").length === 3) return host.split(".")[0];
  if (host.endsWith(".vercel.app") && host.split(".").length >= 3) return host.split(".")[0];
  return null;
}

function ScoreRing({ score, grade, size = 120, color }: { score: number; grade: string; size?: number; color?: string }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const c = color || (score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444");
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8} stroke="#e5e7eb" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8} stroke={c}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      <g className="transform rotate-90" style={{ transformOrigin: "center" }}>
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" className="text-2xl font-bold" fill="#1f2937">{score}</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" className="text-sm font-semibold" fill={c}>{grade}</text>
      </g>
    </svg>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm">
      <span className={"w-2 h-2 rounded-full " + color} />
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-800">{value}</span>
    </div>
  );
}

export default function SiteContent() {
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState<string | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [report, setReport] = useState<any>(null);
  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [commentary, setCommentary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const s = searchParams.get("slug") || getSlugFromHost();
    setSlug(s);
    if (!s) { setError("no-slug"); setLoading(false); return; }

    fetch(SUPABASE_URL + "/rest/v1/bmp_partner_clients?client_slug=eq." + s + "&status=eq.active&select=client_name,client_slug,client_url,client_industry,site_mode,gamma_site_url&limit=1", {
      headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.[0]) { setError("not-found"); setLoading(false); return; }
        const c = data[0] as ClientData;
        setClient(c);
        if (c.site_mode === "gamma" && c.gamma_site_url) { window.location.href = c.gamma_site_url; return; }
        if (c.site_mode === "disabled" || !c.site_mode) { setError("disabled"); setLoading(false); return; }

        Promise.all([
          fetch(BAWEE_EF + "/geobh-geo-report?slug=" + s + "&format=json").then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch(BAWEE_EF + "/geobh-data?slug=" + s).then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch(BAWEE_EF + "/geobh-ai-commentary?slug=" + s + "&tab=overview").then((r) => r.ok ? r.json() : null).catch(() => null),
        ]).then(([rep, brand, comm]) => {
          setReport(rep);
          if (brand?.config) setBrandConfig(brand.config);
          if (brand?.faqs) setFaqs(brand.faqs.filter((f: any) => f.question && f.answer).slice(0, 5));
          const raw = comm?.commentary;
          const txt = typeof raw === "string" ? raw : raw?.claude || raw?.gpt || null;
          if (txt) setCommentary(txt.length > 800 ? txt.slice(0, 800) + "..." : txt);
        }).finally(() => setLoading(false));
      })
      .catch(() => { setError("fetch-error"); setLoading(false); });
  }, [searchParams]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50"><div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (client?.site_mode === "gamma") return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">리다이렉트 중...</p></div>;
  if (error === "disabled" && client) return <div className="min-h-screen flex flex-col items-center justify-center p-8"><h1 className="text-3xl font-bold mb-4">{client.client_name}</h1><p className="text-gray-500 mb-8">허브사이트가 준비 중입니다.</p>{client.client_url && <a href={client.client_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">공식 웹사이트 방문 →</a>}</div>;
  if (error || !client) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">페이지를 찾을 수 없습니다.</p></div>;

  const p = report?.pillars || {};
  const geoScore = report?.authority_index || 0;
  const geoGrade = report?.authority_grade || "-";
  const brandName = client.client_name;
  const industry = client.client_industry || "";
  const brandDesc = brandConfig?.brand_description || "";
  const siteUrl = client.client_url || brandConfig?.site_domain || "";
  const primaryColor = brandConfig?.primary_color || "#3B82F6";
  const logoUrl = brandConfig?.logo_url;
  const cleanMd = (s: string) => s.replace(/#{1,3}\s*/g, "").replace(/\*\*/g, "").replace(/\n{3,}/g, "\n\n");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-8 rounded-lg object-contain" /> : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: primaryColor }}>{brandName.charAt(0)}</div>}
            <span className="font-bold text-lg">{brandName}</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["소개","서비스","GEO 분석","인사이트","문의"].map((item) => <a key={item} href={"#" + item} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{item}</a>)}
          </div>
          {siteUrl && <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90" style={{ background: primaryColor }}>공식 사이트</a>}
        </div>
      </nav>

      {/* Hero */}
      <section id="소개" className="pt-32 pb-20 px-6 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6" style={{ background: primaryColor + "20", color: primaryColor }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primaryColor }} />
              AI 검색 최적화 모니터링 중
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              {brandName}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r" style={{ backgroundImage: "linear-gradient(to right, " + primaryColor + ", #6366f1)" }}>
                {brandDesc || "GEO 브랜드 허브"}
              </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              {industry ? industry + " 분야의 " + brandName + ". " : ""} AI 검색엔진(ChatGPT, Perplexity, Google AI 등)에서 브랜드 권위도를 실시간으로 모니터링하고 최적화합니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#GEO 분석" className="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90" style={{ background: primaryColor }}>GEO 진단 결과 보기</a>
              <a href="#문의" className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">상담 신청</a>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl blur-3xl opacity-20" style={{ background: primaryColor }} />
              <div className="relative bg-white rounded-2xl shadow-xl p-8 text-center">
                <p className="text-sm font-medium text-gray-500 mb-4">GEO Authority Index&#8482;</p>
                <div className="flex justify-center mb-4"><ScoreRing score={geoScore} grade={geoGrade} size={160} color={primaryColor} /></div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Pill label="EEAT" value={String(p.eeat?.score ?? "-")} color="bg-blue-500" />
                  <Pill label="SoM" value={(p.som?.share ?? 0) + "%"} color="bg-indigo-500" />
                  <Pill label="Moat" value={String(p.citation_moat?.score ?? 0)} color="bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services — personalized */}
      <section id="서비스" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{brandName}의 AI 검색 최적화</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{industry ? industry + " 분야에서 " : ""}AI 검색엔진이 {brandName}를 정확하고 긍정적으로 인용하도록 최적화합니다.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🔍", title: "E-E-A-T 최적화", desc: brandName + "의 경험, 전문성, 권위성, 신뢰성을 구조적으로 강화합니다.", stat: p.eeat?.score != null ? "현재 " + p.eeat.score + "점 " + (p.eeat.grade || "") + "등급" : null },
              { icon: "📊", title: "AI 검색 점유율", desc: "ChatGPT, Perplexity, Google AI에서 " + brandName + "가 얼마나 자주 언급되는지 추적합니다.", stat: p.som?.share != null ? "현재 " + p.som.share + "% 점유" : null },
              { icon: "🏰", title: "Citation Moat", desc: "AI 엔진이 " + brandName + "를 반복 인용하는 신뢰 소스를 구축합니다.", stat: p.citation_moat?.score != null ? "현재 " + p.citation_moat.score + "점" : null },
              { icon: "🔗", title: "구조화 데이터", desc: "Schema.org 기반 JSON-LD를 설치하여 AI 엔진이 " + brandName + "를 정확히 이해하도록 합니다.", stat: p.compliance?.score != null ? "준수율 " + p.compliance.score + "%" : null },
              { icon: "📝", title: "AI 최적화 콘텐츠", desc: (industry || "브랜드") + " 전문 콘텐츠를 AI 엔진이 학습하기 좋은 형태로 제작합니다.", stat: null },
              { icon: "📈", title: "월간 GEO 리포트", desc: "매월 " + brandName + "의 Authority Index, SoM 변동, 개선 성과를 보고합니다.", stat: null },
            ].map((s) => (
              <div key={s.title} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <span className="text-3xl">{s.icon}</span>
                <h3 className="text-lg font-bold mt-4 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                {s.stat && <p className="text-xs font-medium mt-3 px-3 py-1 rounded-full inline-block" style={{ background: primaryColor + "15", color: primaryColor }}>{s.stat}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GEO Analysis */}
      {report && (
        <section id="GEO 분석" className="py-20 px-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{brandName} GEO 진단 현황</h2>
              <p className="text-gray-600">AI 검색 최적화 5대 핵심 지표</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "EEAT", score: p.eeat?.score, grade: p.eeat?.grade, color: primaryColor },
                { label: "SoM", score: p.som?.share ?? p.som?.score, grade: null, color: "#6366f1" },
                { label: "Citation Moat", score: p.citation_moat?.score, grade: p.citation_moat?.grade, color: "#10b981" },
                { label: "컴플라이언스", score: p.compliance?.score, grade: null, color: "#f59e0b" },
                { label: "경쟁 우위", score: p.competitive?.self_share != null ? Math.round(p.competitive.self_share) : null, grade: null, color: "#ef4444" },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl p-5 text-center shadow-sm">
                  <p className="text-xs text-gray-500 mb-2">{kpi.label}</p>
                  <p className="text-3xl font-bold" style={{ color: kpi.color }}>{kpi.score ?? "-"}{kpi.label === "SoM" || kpi.label === "경쟁 우위" ? "%" : ""}</p>
                  {kpi.grade && <p className="text-xs text-gray-400 mt-1">{kpi.grade}등급</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Insights — AI commentary */}
      <section id="인사이트" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-3xl font-bold mb-4">{brandName} AI 분석 인사이트</h2></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl p-8 text-white" style={{ background: "linear-gradient(135deg, " + primaryColor + ", #4338ca)" }}>
              <h3 className="text-xl font-bold mb-4">{commentary ? "AI 전문 분석" : "AI 검색 시대의 과제"}</h3>
              <div className="text-sm leading-relaxed opacity-90 whitespace-pre-line">
                {commentary ? cleanMd(commentary) : brandName + "의 AI 검색 최적화를 위한 전략적 분석이 진행 중입니다. GEO Authority Index를 기반으로 E-E-A-T 강화, Citation Moat 구축, SoM 확대 등 체계적인 개선 방안을 수립합니다."}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4">Powered by GEOcare.AI</h3>
              <p className="text-gray-600 leading-relaxed mb-4">비즈스프링의 GEOcare.AI는 AI 검색 최적화를 위한 올인원 SaaS 플랫폼입니다. {brandName}의 5대 KPI를 자동 진단하고, 실시간 모니터링과 AI 기반 액션플랜을 생성합니다.</p>
              <div className="flex flex-wrap gap-2 mb-4">{["EEAT 진단","SoM 추적","Citation Moat","JSON-LD","AI 콘텐츠"].map((t) => <span key={t} className="text-xs px-3 py-1 rounded-full bg-white border text-gray-600">{t}</span>)}</div>
              <a href="https://geocare.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium hover:underline" style={{ color: primaryColor }}>GEOcare.AI 알아보기 →</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12"><h2 className="text-3xl font-bold mb-4">{brandName} 자주 묻는 질문</h2></div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <span className="font-medium text-sm pr-4">{faq.question}</span>
                    <span className="text-gray-400 flex-shrink-0">{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && <div className="px-6 pb-4"><p className="text-sm text-gray-600 leading-relaxed">{faq.answer.slice(0, 300)}{faq.answer.length > 300 ? "..." : ""}</p></div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section id="문의" className="py-20 px-6" style={{ background: "linear-gradient(135deg, " + primaryColor + ", #4338ca)" }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">{brandName}의 AI 검색 전략이 궁금하신가요?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">전문 컨설턴트가 {brandName}에 맞는 GEO 최적화 전략을 제안해 드립니다.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://geocare.ai" target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-white font-bold rounded-lg hover:bg-gray-100" style={{ color: primaryColor }}>무료 진단 받기</a>
            {siteUrl && <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-3 border-2 border-white/40 text-white font-medium rounded-lg hover:bg-white/10">{brandName} 공식 사이트</a>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><span className="font-bold text-white">{brandName}</span><span className="text-xs">{brandDesc || "GEO 브랜드 허브"}</span></div>
          <div className="text-xs text-center">Powered by <a href="https://geocare.ai" className="text-blue-400 hover:underline">GEOcare.AI</a> · <a href="https://bmp.ai" className="text-blue-400 hover:underline">bmp.ai</a> · © 2026 BizSpring Inc.</div>
        </div>
      </footer>
    </div>
  );
}
