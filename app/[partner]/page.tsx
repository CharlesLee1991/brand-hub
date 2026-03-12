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
  if (!grade) return "#9ca3af";
  const g = grade.replace("+", "").charAt(0);
  const map: Record<string, string> = { A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#f97316", F: "#ef4444" };
  return map[g] || "#9ca3af";
}

function somColor(pct: number): string {
  if (pct >= 50) return "#10b981";
  if (pct >= 30) return "#3b82f6";
  if (pct >= 15) return "#f59e0b";
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

  if (authLoading || loading) {
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>);
  }
  if (!user) { router.replace("/login?redirect=/" + partner); return null; }
  if (!canAccess(partner)) {
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1><p className="text-gray-600 mb-2">접근 권한이 없습니다.</p><p className="text-sm text-gray-400 mb-6">이 파트너 페이지에 대한 권한이 없습니다.</p><button onClick={() => signOut().then(() => router.replace("/login"))} className="text-blue-600 hover:underline text-sm">다른 계정으로 로그인</button></div></div>);
  }
  if (!config) {
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1><p className="text-gray-600 mb-6">등록되지 않은 파트너입니다.</p><Link href="/" className="text-blue-600 hover:underline">홈으로 돌아가기</Link></div></div>);
  }

  const color = config.primary_color || "#3B82F6";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: color }}>{config.brand_name.charAt(0)}</div>
          <span className="font-bold text-gray-900">{config.brand_name}</span>
          <span className="text-xs text-gray-400 ml-1">Brand Hub</span>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={loadData} className="text-gray-400 hover:text-gray-600" title="새로고침"><RefreshCw className="w-4 h-4" /></button>
            <span className="text-xs text-gray-400">{displayName || user?.email}</span>
            {isAdmin && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Admin</span>}
            <button onClick={() => signOut().then(() => router.replace("/login"))} className="text-gray-400 hover:text-gray-600" title="로그아웃"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <section className="rounded-2xl p-8 text-white mb-8" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
          <h1 className="text-2xl font-bold mb-2">{config.brand_name}</h1>
          <p className="text-white/80 leading-relaxed">{config.brand_description}</p>
          {config.site_domain && (
            <a href={config.site_domain} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm text-white/60 hover:text-white/90 transition-colors">
              {config.site_domain.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </section>

        {hubType === "agency" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900"><Users className="w-5 h-5 inline mr-2 text-gray-400" />담당 고객사</h2>
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
                  <div key={client.slug} className="bg-white rounded-xl border hover:shadow-lg hover:border-gray-300 transition-all group">
                    <Link href={isSubdomain ? `/${client.slug}` : `/${partner}/${client.slug}`} className="block p-5 pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{client.name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{client.industry}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{client.url.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {/* EEAT */}
                        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                          <Shield className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: gradeColor(client.eeat?.grade || null) }} />
                          {client.eeat ? (<><div className="text-base font-black" style={{ color: gradeColor(client.eeat.grade) }}>{client.eeat.grade}</div><div className="text-[9px] text-gray-400">EEAT {client.eeat.score}</div></>) : (<><div className="text-sm font-bold text-gray-300">—</div><div className="text-[9px] text-gray-400">EEAT</div></>)}
                        </div>
                        {/* SoM */}
                        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                          <Activity className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: client.som ? somColor(client.som.som_pct) : "#9ca3af" }} />
                          {client.som ? (<><div className="text-base font-black" style={{ color: somColor(client.som.som_pct) }}>{client.som.som_pct}%</div><div className="text-[9px] text-gray-400">SoM {client.som.total_responses.toLocaleString()}</div></>) : (<><div className="text-sm font-bold text-gray-300">—</div><div className="text-[9px] text-gray-400">SoM</div></>)}
                        </div>
                        {/* Moat */}
                        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                          <BarChart3 className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: gradeColor(client.moat?.grade || null) }} />
                          {client.moat ? (<><div className="text-base font-black" style={{ color: gradeColor(client.moat.grade) }}>{client.moat.grade}</div><div className="text-[9px] text-gray-400">Moat {client.moat.score}</div></>) : (<><div className="text-sm font-bold text-gray-300">—</div><div className="text-[9px] text-gray-400">Moat</div></>)}
                        </div>
                        {/* Coverage */}
                        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                          <TrendingUp className="w-3.5 h-3.5 mx-auto mb-0.5 text-gray-400" />
                          {client.moat ? (<><div className="text-base font-black text-gray-700">{client.moat.query_coverage}%</div><div className="text-[9px] text-gray-400">커버리지</div></>) : (<><div className="text-sm font-bold text-gray-300">—</div><div className="text-[9px] text-gray-400">커버리지</div></>)}
                        </div>
                      </div>
                    </Link>

                    {/* Analysis trigger bar */}
                    <div className="px-5 pb-4 pt-1">
                      <div className="flex items-center gap-1.5 border-t pt-3">
                        <span className="text-[10px] text-gray-400 mr-1">분석:</span>
                        {(["eeat", "som", "citation", "all"] as const).map((type) => {
                          const key = `${client.slug}-${type}`;
                          const state = triggerState[key];
                          const labels: Record<string, string> = { eeat: "EEAT", som: "SoM", citation: "Citation", all: "전체" };
                          return (
                            <button key={type} onClick={(e) => { e.preventDefault(); triggerAnalysis(client, type); }} disabled={state === "running"}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${state === "running" ? "bg-blue-50 text-blue-400 cursor-wait" : state === "done" ? "bg-green-50 text-green-600" : state === "error" ? "bg-red-50 text-red-500" : type === "all" ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
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
          <section className="bg-white rounded-xl border p-8 text-center">
            <p className="text-gray-600">이 페이지는 파트너 대시보드입니다.</p>
            <p className="text-sm text-gray-400 mt-2">고객/내부 허브는 직접 접근하세요.</p>
          </section>
        )}
      </main>
    </div>
  );
}
