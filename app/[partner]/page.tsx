"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft, Loader2, Shield, TrendingUp, Users, ChevronRight,
  ExternalLink, BarChart3, LogOut, Activity, Play, RefreshCw,
  CheckCircle2, AlertCircle,
} from "lucide-react";

interface PartnerConfig {
  hub_slug: string; brand_name: string; brand_description: string;
  logo_url: string | null; primary_color: string; site_domain: string;
}

interface ClientInfo {
  slug: string; name: string; url: string; industry: string;
  diagnosis_status: string; action_status: string;
  eeat: { grade: string; score: number } | null;
  moat: { score: number; grade: string; citation_rate: number; query_coverage: number } | null;
  som: { total_responses: number; mentioned: number; som_pct: number } | null;
}

const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";

function gradeColor(grade: string | null): string {
  if (!grade) return "#5A6178";
  const g = grade.replace("+", "").charAt(0);
  const map: Record<string, string> = { A: "#00C48C", B: "#0066FF", C: "#FFB800", D: "#f97316", F: "#ef4444" };
  return map[g] || "#5A6178";
}

function somColor(pct: number): string {
  if (pct >= 50) return "#00C48C";
  if (pct >= 30) return "#0066FF";
  if (pct >= 15) return "#FFB800";
  return "#ef4444";
}

export default function PartnerPage() {
  const params = useParams();
  const router = useRouter();
  const partner = params.partner as string;
  const { user, loading: authLoading, canAccess, signOut, displayName, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [config, setConfig] = useState<PartnerConfig | null>(null);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [hubType, setHubType] = useState<string>("");
  const [triggerState, setTriggerState] = useState<Record<string, string>>({});

  useEffect(() => {
    const host = window.location.hostname;
    const isSub = (host.endsWith('.bmp.ai') || host.endsWith('.vercel.app')) && host.split('.').length > 2;
    setIsSubdomain(isSub);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BAWEE_EF}/geobh-data?slug=${partner}`);
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setClients(data.clients || []);
        setHubType(data.hub_type || "");
      }
    } catch (err) { console.error("Load error:", err); }
    finally { setLoading(false); }
  }, [partner]);

  useEffect(() => { loadData(); }, [loadData]);

  const triggerAnalysis = async (client: ClientInfo, type: "eeat" | "som" | "citation" | "all") => {
    const key = `${client.slug}-${type}`;
    setTriggerState(prev => ({ ...prev, [key]: "running" }));
    try {
      if (type === "eeat" || type === "all") {
        await fetch(`${BAWEE_EF}/geobh-api/analyze`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: client.url, slug: client.slug, industry: client.industry }),
        });
      }
      if (type === "citation" || type === "all") {
        await fetch(`${BAWEE_EF}/geobh-api/generate-report`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site_domain: client.url, target: "citation", force_refresh: true }),
        });
      }
      if (type === "som" || type === "all") {
        await fetch(`${BAWEE_EF}/geobh-api/generate-report`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site_domain: client.url, target: "report", force_refresh: true }),
        });
      }
      setTriggerState(prev => ({ ...prev, [key]: "done" }));
      setTimeout(() => setTriggerState(prev => { const n = { ...prev }; delete n[key]; return n; }), 3000);
    } catch {
      setTriggerState(prev => ({ ...prev, [key]: "error" }));
      setTimeout(() => setTriggerState(prev => { const n = { ...prev }; delete n[key]; return n; }), 3000);
    }
  };

  /* ── Loading ── */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  /* ── Auth ── */
  if (!user) { router.replace("/login?redirect=/" + partner); return null; }
  if (!canAccess(partner)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">403</h1>
          <p className="text-gray-400 mb-2">접근 권한이 없습니다.</p>
          <p className="text-sm text-gray-500 mb-6">이 파트너 페이지에 대한 권한이 없습니다.</p>
          <button onClick={() => signOut().then(() => router.replace("/login"))} className="text-blue-400 hover:underline text-sm">다른 계정으로 로그인</button>
        </div>
      </div>
    );
  }
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <p className="text-gray-400 mb-6">등록되지 않은 파트너입니다.</p>
          <Link href="/" className="text-blue-400 hover:underline">홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const color = config.primary_color || "#0066FF";

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-deep)" }}>
      <div className="bg-ambient" />
      <div className="bg-noise" />

      <div className="relative z-10">
        {/* ━━━ HEADER ━━━ */}
        <header className="sticky top-0 z-50" style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-glass)" }}>
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: color }}>{config.brand_name.charAt(0)}</div>
            <span className="font-bold text-white">{config.brand_name}</span>
            <span className="text-xs text-gray-500 ml-1">Brand Hub</span>
            <div className="ml-auto flex items-center gap-3">
              <button onClick={loadData} className="text-gray-500 hover:text-white transition-colors" title="새로고침"><RefreshCw className="w-4 h-4" /></button>
              <span className="text-xs text-gray-500">{displayName || user?.email}</span>
              {isAdmin && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-medium">Admin</span>}
              <button onClick={() => signOut().then(() => router.replace("/login"))} className="text-gray-500 hover:text-white transition-colors" title="로그아웃"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* ━━━ HERO BANNER ━━━ */}
          <section className="glass glass-gradient rounded-2xl p-8 mb-8" style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)`, borderColor: `${color}30` }}>
            <h1 className="text-2xl font-bold text-white mb-2">{config.brand_name}</h1>
            <p className="text-gray-400 leading-relaxed">{config.brand_description}</p>
            {config.site_domain && (
              <a href={config.site_domain} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm text-gray-500 hover:text-white transition-colors">
                {config.site_domain.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </section>

          {/* ━━━ CLIENTS ━━━ */}
          {hubType === "agency" && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white"><Users className="w-5 h-5 inline mr-2 text-gray-500" />담당 고객사</h2>
                <span className="text-sm text-gray-500">{clients.length}개 고객사</span>
              </div>

              {clients.length === 0 ? (
                <div className="glass glass-gradient rounded-xl p-12 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-400 mb-2">등록된 고객사가 없습니다</h3>
                  <p className="text-sm text-gray-500">관리자에게 고객사 등록을 요청하세요.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-5">
                  {clients.map((cl) => (
                    <div key={cl.slug} className="glass glass-gradient glass-hover group" style={{ padding: 0 }}>
                      <Link href={isSubdomain ? `/${cl.slug}` : `/${partner}/${cl.slug}`} className="block p-6 pb-3">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors">{cl.name}</h3>
                            <p className="text-sm text-gray-400 mt-0.5">{cl.industry}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{cl.url.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-300 transition-colors mt-1" />
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-4 gap-2">
                          {/* EEAT */}
                          <div className="rounded-lg p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <Shield className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: gradeColor(cl.eeat?.grade || null) }} />
                            {cl.eeat ? (<><div className="text-base font-black tabular-nums" style={{ color: gradeColor(cl.eeat.grade) }}>{cl.eeat.grade}</div><div className="text-[9px] text-gray-500">EEAT {cl.eeat.score}</div></>) : (<><div className="text-sm font-bold text-gray-600">—</div><div className="text-[9px] text-gray-500">EEAT</div></>)}
                          </div>
                          {/* SoM */}
                          <div className="rounded-lg p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <Activity className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: cl.som ? somColor(cl.som.som_pct) : "#5A6178" }} />
                            {cl.som ? (<><div className="text-base font-black tabular-nums" style={{ color: somColor(cl.som.som_pct) }}>{cl.som.som_pct}%</div><div className="text-[9px] text-gray-500">SoM {cl.som.total_responses.toLocaleString()}</div></>) : (<><div className="text-sm font-bold text-gray-600">—</div><div className="text-[9px] text-gray-500">SoM</div></>)}
                          </div>
                          {/* Moat */}
                          <div className="rounded-lg p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <BarChart3 className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: gradeColor(cl.moat?.grade || null) }} />
                            {cl.moat ? (<><div className="text-base font-black tabular-nums" style={{ color: gradeColor(cl.moat.grade) }}>{cl.moat.grade}</div><div className="text-[9px] text-gray-500">Moat {cl.moat.score}</div></>) : (<><div className="text-sm font-bold text-gray-600">—</div><div className="text-[9px] text-gray-500">Moat</div></>)}
                          </div>
                          {/* Coverage */}
                          <div className="rounded-lg p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <TrendingUp className="w-3.5 h-3.5 mx-auto mb-0.5 text-gray-500" />
                            {cl.moat ? (<><div className="text-base font-black tabular-nums text-gray-300">{cl.moat.query_coverage}%</div><div className="text-[9px] text-gray-500">커버리지</div></>) : (<><div className="text-sm font-bold text-gray-600">—</div><div className="text-[9px] text-gray-500">커버리지</div></>)}
                          </div>
                        </div>
                      </Link>

                      {/* Analysis Trigger Bar */}
                      <div className="px-6 pb-5 pt-1">
                        <div className="flex items-center gap-1.5 pt-3" style={{ borderTop: "1px solid var(--border-glass)" }}>
                          <span className="text-[10px] text-gray-500 mr-1">분석:</span>
                          {(["eeat", "som", "citation", "all"] as const).map((type) => {
                            const key = `${cl.slug}-${type}`;
                            const state = triggerState[key];
                            const labels: Record<string, string> = { eeat: "EEAT", som: "SoM", citation: "Citation", all: "전체" };
                            return (
                              <button key={type} onClick={(e) => { e.preventDefault(); triggerAnalysis(cl, type); }} disabled={state === "running"}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                                  state === "running" ? "bg-blue-500/15 text-blue-300 cursor-wait"
                                  : state === "done" ? "bg-emerald-500/15 text-emerald-300"
                                  : state === "error" ? "bg-red-500/15 text-red-400"
                                  : type === "all" ? "bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25"
                                  : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`} style={{ border: "none" }}>
                                {state === "running" ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : state === "done" ? <CheckCircle2 className="w-2.5 h-2.5" /> : state === "error" ? <AlertCircle className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                                {labels[type]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {hubType !== "agency" && (
            <section className="glass glass-gradient rounded-xl p-8 text-center">
              <p className="text-gray-400">이 페이지는 파트너 대시보드입니다.</p>
              <p className="text-sm text-gray-500 mt-2">고객/내부 허브는 직접 접근하세요.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
