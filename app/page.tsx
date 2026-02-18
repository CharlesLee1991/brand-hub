"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Bot,
  Shield,
  TrendingUp,
  ArrowRight,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface HubEntry {
  hub_slug: string;
  brand_name: string;
  brand_description: string;
  primary_color: string;
  hub_type: string;
}

const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";

export default function HomePage() {
  const [hubs, setHubs] = useState<HubEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-xl">Brand Hub</span>
          </div>
          <a href="https://geo-platform.lovable.app" target="_blank" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
            GEOcare <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" /><span>GEOcare Premium 파일럿</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            AI가 학습한<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">브랜드 지식 허브</span>
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            E-E-A-T 진단부터 PR-GEO 통합 실행까지<br />파트너사별 AI 어시스턴트가 브랜드 전략을 안내합니다.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mt-8">
            <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-blue-500" />E-E-A-T 자동 진단</div>
            <div className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-green-500" />컴플라이언스 체크</div>
            <div className="flex items-center gap-1.5"><Bot className="w-4 h-4 text-purple-500" />AI 어시스턴트</div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">파일럿 파트너사</h2>
          <p className="text-gray-600 text-center mb-10">아래 파트너사의 브랜드 허브를 체험해보세요</p>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {agencies.map((hub) => (
                <Link key={hub.hub_slug} className="group block" href={`/${hub.hub_slug}`}>
                  <div className="border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `linear-gradient(135deg, ${hub.primary_color}, ${hub.primary_color}cc)` }}>
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{hub.brand_name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{hub.brand_description}</p>
                    <div className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all" style={{ color: hub.primary_color }}>
                      브랜드 허브 방문 <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">작동 방식</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "E-E-A-T 자동 진단", desc: "웹사이트의 Experience, Expertise, Authoritativeness, Trustworthiness를 AI가 분석합니다.", color: "#3b82f6" },
              { step: "02", title: "컴플라이언스 스크리닝", desc: "의료광고법 등 업종별 규제 위반 사항을 자동 탐지하고 수정안을 제안합니다.", color: "#8b5cf6" },
              { step: "03", title: "파트너 매칭 & 실행", desc: "진단 결과에 따라 최적의 파트너사를 매칭하고 PR-GEO 통합 전략을 실행합니다.", color: "#10b981" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: item.color }}>{item.step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <span>© 2026 BizSpring — Brand Hub (bmp.ai)</span>
          <span>Powered by GEOcare.AI</span>
        </div>
      </footer>
    </div>
  );
}
