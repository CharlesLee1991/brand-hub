"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Shield,
  TrendingUp,
  Users,
  ChevronRight,
  ExternalLink,
  BarChart3,
} from "lucide-react";

interface PartnerConfig {
  hub_slug: string;
  brand_name: string;
  brand_description: string;
  logo_url: string | null;
  primary_color: string;
  site_domain: string;
}

interface ClientInfo {
  slug: string;
  name: string;
  url: string;
  industry: string;
  eeat: { grade: string; score: number } | null;
  moat: { score: number; grade: string; citation_rate: number; query_coverage: number } | null;
}

const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";

function gradeColor(grade: string | null): string {
  if (!grade) return "#9ca3af";
  const map: Record<string, string> = { A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#f97316", F: "#ef4444" };
  return map[grade] || "#9ca3af";
}

function moatGradeLabel(grade: string): string {
  const map: Record<string, string> = {
    A: "AI가 신뢰",
    B: "성장 가능",
    C: "잠재력",
    D: "약함",
    F: "인용 없음",
  };
  return map[grade] || grade;
}

export default function PartnerPage() {
  const params = useParams();
  const partner = params.partner as string;

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<PartnerConfig | null>(null);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [hubType, setHubType] = useState<string>("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${BAWEE_EF}/geobh-data?slug=${partner}`);
        const data = await res.json();
        if (data.success) {
          setConfig(data.config);
          setClients(data.clients || []);
          setHubType(data.hub_type || "");
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [partner]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-6">등록되지 않은 파트너입니다.</p>
          <Link href="/" className="text-blue-600 hover:underline">홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const color = config.primary_color || "#3B82F6";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: color }}>
            {config.brand_name.charAt(0)}
          </div>
          <span className="font-bold text-gray-900">{config.brand_name}</span>
          <span className="text-xs text-gray-400 ml-1">Brand Hub</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <section
          className="rounded-2xl p-8 text-white mb-8"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
        >
          <h1 className="text-2xl font-bold mb-2">{config.brand_name}</h1>
          <p className="text-white/80 leading-relaxed">{config.brand_description}</p>
          {config.site_domain && (
            <a
              href={config.site_domain}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-white/60 hover:text-white/90 transition-colors"
            >
              {config.site_domain.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </section>

        {/* Client List */}
        {hubType === "agency" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                <Users className="w-5 h-5 inline mr-2 text-gray-400" />
                담당 고객사
              </h2>
              <span className="text-sm text-gray-400">{clients.length}개 고객사</span>
            </div>

            {clients.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center">
                <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-400 mb-2">등록된 고객사가 없습니다</h3>
                <p className="text-sm text-gray-400">관리자에게 고객사 등록을 요청하세요.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {clients.map((client) => (
                  <Link
                    key={client.slug}
                    href={`/${partner}/${client.slug}`}
                    className="bg-white rounded-xl border p-5 hover:shadow-lg hover:border-gray-300 transition-all group block"
                  >
                    {/* Top row: name + industry */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {client.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">{client.industry}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {client.url.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
                    </div>

                    {/* Score cards row */}
                    <div className="flex gap-3">
                      {/* EEAT */}
                      <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                        <Shield className="w-4 h-4 mx-auto mb-1" style={{ color: gradeColor(client.eeat?.grade || null) }} />
                        {client.eeat ? (
                          <>
                            <div className="text-lg font-black" style={{ color: gradeColor(client.eeat.grade) }}>
                              {client.eeat.grade}
                            </div>
                            <div className="text-[10px] text-gray-400">EEAT {client.eeat.score}점</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-bold text-gray-300">—</div>
                            <div className="text-[10px] text-gray-400">EEAT 미분석</div>
                          </>
                        )}
                      </div>

                      {/* Citation Moat */}
                      <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                        <BarChart3 className="w-4 h-4 mx-auto mb-1" style={{ color: gradeColor(client.moat?.grade || null) }} />
                        {client.moat ? (
                          <>
                            <div className="text-lg font-black" style={{ color: gradeColor(client.moat.grade) }}>
                              {client.moat.score}
                            </div>
                            <div className="text-[10px] text-gray-400">Moat {client.moat.grade} · {moatGradeLabel(client.moat.grade)}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-bold text-gray-300">—</div>
                            <div className="text-[10px] text-gray-400">Citation 미분석</div>
                          </>
                        )}
                      </div>

                      {/* Coverage */}
                      <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                        <TrendingUp className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                        {client.moat ? (
                          <>
                            <div className="text-lg font-black text-gray-700">
                              {client.moat.query_coverage}%
                            </div>
                            <div className="text-[10px] text-gray-400">쿼리 커버리지</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-bold text-gray-300">—</div>
                            <div className="text-[10px] text-gray-400">커버리지</div>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Non-agency (client/internal) → redirect to old behavior */}
        {hubType !== "agency" && (
          <section className="bg-white rounded-xl border p-8 text-center">
            <p className="text-gray-600">이 페이지는 파트너 대시보드입니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              고객/내부 허브는 직접 접근하세요.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
