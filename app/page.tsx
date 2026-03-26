"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap, Bot, Shield, TrendingUp, ArrowRight, Loader2,
  ExternalLink, Activity, BarChart3, FileSearch, Sparkles,
} from "lucide-react";

interface HubEntry {
  hub_slug: string;
  brand_name: string;
  brand_description: string;
  primary_color: string;
  hub_type: string;
}

const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";

const AI_MODELS = [
  { name: "ChatGPT", status: "active" as const },
  { name: "Gemini", status: "syncing" as const },
  { name: "Claude", status: "active" as const },
  { name: "Perplexity", status: "active" as const },
  { name: "Grok", status: "idle" as const },
];

function StatusDot({ status }: { status: "active" | "syncing" | "idle" }) {
  const cls =
    status === "active"
      ? "w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(0,196,140,0.5)]"
      : status === "syncing"
      ? "w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse-dot"
      : "w-1.5 h-1.5 rounded-full bg-gray-300";
  return <span className={cls} />;
}

export default function HomePage() {
  const [hubs, setHubs] = useState<HubEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  useEffect(() => {
    async function loadHubs() {
      try {
        const res = await fetch(`${BAWEE_EF}/geobh-data?list=all`);
        const data = await res.json();
        if (data.success !== false && Array.isArray(data.hubs)) {
          setHubs(data.hubs);
        } else {
          setHubs([
            { hub_slug: "hahmshout", brand_name: "함샤우트글로벌", brand_description: "종합 커뮤니케이션 전문 그룹. PR, IMC, 디지털 마케팅, AI 기반 GEO 통합 솔루션", primary_color: "#1A1A2E", hub_type: "agency" },
            { hub_slug: "mprd", brand_name: "㈜엠피알디 (mprd)", brand_description: "크리에이티브 웹에이전시. 마케팅, 기획, 개발, 제작 분야의 디지털 에이전시", primary_color: "#E63946", hub_type: "agency" },
            { hub_slug: "frameout", brand_name: "프레임아웃", brand_description: "중대형 고객 전문 웹 에이전시. E-E-A-T 기반 웹사이트 구축", primary_color: "#2D3748", hub_type: "agency" },
            { hub_slug: "mplanit", brand_name: "엠플랜잇", brand_description: "퍼포먼스 마케팅 전문. 광고, 디스플레이, 유튜브 운영", primary_color: "#6C63FF", hub_type: "agency" },
          ]);
        }
      } catch { setHubs([]); }
      finally { setLoading(false); }
    }
    loadHubs();
  }, []);

  const agencies = hubs.filter((h) => h.hub_type === "agency");

  return (
    <div className="min-h-screen relative bg-[#F8F9FC]">
      <div className="bg-ambient" />

      <div className="relative z-10">
        {/* ━━━ HEADER ━━━ */}
        <header
          className="sticky top-0 z-50 border-b border-gray-100"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "none" : "translateY(-8px)",
            transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-extrabold text-[15px] text-white" style={{ background: "var(--gradient-brand)" }}>
                B
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span className="font-display text-[20px] font-[750] tracking-tight text-gray-900">bmp</span>
                  <span className="font-display text-[20px] font-[750] tracking-tight" style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>.ai</span>
                </div>
                <span className="text-[10px] text-gray-400 tracking-[0.08em] font-medium uppercase leading-none">Brand Management Platform</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-semibold text-gray-400 tracking-[0.06em] uppercase">AI 연결</span>
                <div className="w-px h-5 bg-gray-200" />
                {AI_MODELS.map((m) => (
                  <div key={m.name} className="flex items-center gap-1.5">
                    <span className={`text-xs font-medium ${m.status === "active" ? "text-gray-700" : "text-gray-400"}`}>{m.name}</span>
                    <StatusDot status={m.status} />
                  </div>
                ))}
              </div>
              <a href="https://geo-platform.lovable.app" target="_blank" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                GEOcare <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </header>

        {/* ━━━ HERO ━━━ */}
        <section className="pt-24 pb-20 px-6">
          <div className="max-w-5xl mx-auto text-center" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(20px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 bg-blue-50 text-blue-600 border border-blue-100">
              <Sparkles className="w-4 h-4" />
              <span>GEOcare Premium 파일럿</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.15] mb-8 tracking-tight text-gray-900">
              AI가 학습한<br />
              <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>브랜드 지식 허브</span>
            </h1>
            <p className="text-xl text-gray-500 mb-6 max-w-2xl mx-auto leading-relaxed">
              E-E-A-T 진단부터 PR-GEO 통합 실행까지<br />파트너사별 AI 어시스턴트가 브랜드 전략을 안내합니다.
            </p>
            <div className="flex items-center justify-center gap-5 mt-10">
              {[
                { icon: Shield, label: "E-E-A-T 자동 진단", color: "#0066FF" },
                { icon: BarChart3, label: "Citation Moat 분석", color: "#00C48C" },
                { icon: Bot, label: "AI 어시스턴트", color: "#8B5CF6" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
                  <Icon className="w-4 h-4" style={{ color }} />{label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ PARTNERS ━━━ */}
        <section className="pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12" style={{ opacity: loaded ? 1 : 0, animation: loaded ? "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both" : "none" }}>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-2 text-gray-900">파일럿 파트너사</h2>
              <p className="text-gray-500">아래 파트너사의 브랜드 허브를 체험해보세요</p>
            </div>
            {loading ? (
              <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto" /></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5" style={{ opacity: loaded ? 1 : 0, animation: loaded ? "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both" : "none" }}>
                {agencies.map((hub) => (
                  <Link key={hub.hub_slug} className="group block" href={`/${hub.hub_slug}`}>
                    <div className="glass glass-gradient glass-hover p-7 cursor-pointer">
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${hub.primary_color}, ${hub.primary_color}cc)` }}>
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-lg text-gray-900 mb-1 tracking-tight">{hub.brand_name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">{hub.brand_description}</p>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-all group-hover:gap-2.5">
                            브랜드 허브 방문 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ━━━ HOW IT WORKS ━━━ */}
        <section className="pb-24 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center tracking-tight mb-14 text-gray-900" style={{ opacity: loaded ? 1 : 0, animation: loaded ? "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both" : "none" }}>작동 방식</h2>
            <div className="grid md:grid-cols-3 gap-6" style={{ opacity: loaded ? 1 : 0, animation: loaded ? "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both" : "none" }}>
              {[
                { step: "01", title: "E-E-A-T 자동 진단", desc: "웹사이트의 Experience, Expertise, Authoritativeness, Trustworthiness를 AI가 분석합니다.", icon: FileSearch, gradient: "from-blue-500 to-blue-700" },
                { step: "02", title: "컴플라이언스 스크리닝", desc: "의료광고법 등 업종별 규제 위반 사항을 자동 탐지하고 수정안을 제안합니다.", icon: Shield, gradient: "from-violet-500 to-violet-700" },
                { step: "03", title: "파트너 매칭 & 실행", desc: "진단 결과에 따라 최적의 파트너사를 매칭하고 PR-GEO 통합 전략을 실행합니다.", icon: Activity, gradient: "from-emerald-500 to-emerald-700" },
              ].map((item) => (
                <div key={item.step} className="glass glass-gradient glass-hover p-8 text-center">
                  <div className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-gradient-to-br ${item.gradient}`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-bold text-gray-400 tracking-widest mb-2">STEP {item.step}</div>
                  <h3 className="font-display font-bold text-gray-900 mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ FOOTER ━━━ */}
        <footer className="border-t border-gray-100 px-6" style={{ opacity: loaded ? 1 : 0, transition: "all 0.6s ease 0.5s" }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between py-8 text-sm text-gray-400">
            <span>© 2026 BizSpring Inc. — bmp.ai</span>
            <span>Powered by GEOcare.AI</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
