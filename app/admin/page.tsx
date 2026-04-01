"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Loader2, Shield, Plus, Play, RefreshCw, ExternalLink,
  ToggleLeft, ToggleRight, Trash2, AlertCircle, CheckCircle2,
  Database, Globe, Link2, Package, ArrowLeft,
} from "lucide-react";

interface SiteRow {
  id: string; site_domain: string; is_pdp_enabled: boolean;
  pdp_source: string; schedule_interval: string; max_products: number;
  last_batch_at: string | null; last_batch_count: number; last_batch_errors: number;
  bmp_jsonld_urls?: { count: number }[];
}
interface UrlRow {
  id: string; product_url: string; status: string;
  last_extracted_at: string | null; error_message: string | null;
  completeness_score?: number;
}
interface Stats {
  total_sites: number; active_sites: number;
  delivery_cached: number; total_extractions: number;
}

const API = "/api/pdp-admin";

export default function AdminPage() {
  const { user, loading: authLoading, isAdmin, signOut, displayName } = useAuth();

  const [stats, setStats] = useState<Stats | null>(null);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteRow | null>(null);
  const [urls, setUrls] = useState<UrlRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Add site form
  const [newDomain, setNewDomain] = useState("");
  const [newSource, setNewSource] = useState("auto");
  const [newSchedule, setNewSchedule] = useState("24h");
  const [showAddSite, setShowAddSite] = useState(false);

  // Add URLs form
  const [newUrls, setNewUrls] = useState("");
  const [showAddUrls, setShowAddUrls] = useState(false);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API + "?action=dashboard");
      const d = await res.json();
      if (d.success) {
        setStats(d.stats);
      }
      const res2 = await fetch(API + "?action=sites");
      const d2 = await res2.json();
      if (d2.success) setSites(d2.sites || []);
    } catch { flash("err", "데이터 로딩 실패"); }
    setLoading(false);
  }, []);

  const loadUrls = async (site: SiteRow) => {
    setSelectedSite(site);
    setLoading(true);
    try {
      const res = await fetch(API + "?action=urls&site_id=" + site.id);
      const d = await res.json();
      if (d.success) setUrls(d.urls || []);
    } catch { flash("err", "URL 로딩 실패"); }
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) loadDashboard(); }, [isAdmin, loadDashboard]);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
          <p className="text-sm text-gray-500 mb-4">슈퍼어드민만 접근할 수 있습니다.</p>
          <a href="/" className="text-sm text-blue-600 hover:underline">← 메인으로 돌아가기</a>
        </div>
      </div>
    );
  }

  const addSite = async () => {
    if (!newDomain.trim()) return;
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_site",
          site_domain: newDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""),
          pdp_source: newSource,
          schedule_interval: newSchedule,
        }),
      });
      const d = await res.json();
      if (d.success) {
        flash("ok", "사이트 추가 완료");
        setNewDomain(""); setShowAddSite(false);
        loadDashboard();
      } else flash("err", "추가 실패: " + JSON.stringify(d));
    } catch { flash("err", "네트워크 오류"); }
  };

  const toggleSite = async (site: SiteRow) => {
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_site",
          site_id: site.id,
          is_pdp_enabled: !site.is_pdp_enabled,
        }),
      });
      const d = await res.json();
      if (d.success) {
        flash("ok", site.site_domain + (site.is_pdp_enabled ? " 비활성화" : " 활성화"));
        loadDashboard();
      }
    } catch { flash("err", "토글 실패"); }
  };

  const addUrls = async () => {
    if (!selectedSite || !newUrls.trim()) return;
    const urlList = newUrls.split("\n").map(u => u.trim()).filter(u => u.startsWith("http"));
    if (urlList.length === 0) { flash("err", "유효한 URL이 없습니다"); return; }
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_urls", site_id: selectedSite.id, urls: urlList }),
      });
      const d = await res.json();
      if (d.success) {
        flash("ok", d.added + "건 URL 추가 완료");
        setNewUrls(""); setShowAddUrls(false);
        loadUrls(selectedSite);
      } else flash("err", "추가 실패");
    } catch { flash("err", "네트워크 오류"); }
  };

  const triggerBatch = async () => {
    flash("ok", "배치 추출 실행 중...");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger_batch" }),
      });
      const d = await res.json();
      if (d.success) {
        const r = d.batch_result || {};
        flash("ok", "배치 완료: " + (r.processed || 0) + "건 처리");
        loadDashboard();
        if (selectedSite) loadUrls(selectedSite);
      } else flash("err", "배치 실패: " + (d.error || ""));
    } catch { flash("err", "배치 트리거 실패"); }
  };

  const statusColor = (s: string) => {
    if (s === "success") return "bg-green-100 text-green-800";
    if (s === "pending") return "bg-yellow-100 text-yellow-800";
    if (s === "failed") return "bg-red-100 text-red-800";
    if (s === "extracting") return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm text-white bg-gradient-to-br from-blue-600 to-blue-800">A</div>
            <div>
              <div className="font-bold text-gray-900 text-sm">PDP Admin</div>
              <div className="text-[10px] text-gray-400">JSON-LD 커머스 관리</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">Admin</span>
            <span className="text-gray-500">{displayName || user?.email}</span>
            <button onClick={() => signOut()} className="text-gray-400 hover:text-gray-600 text-xs">로그아웃</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Flash message */}
        {msg && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${msg.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.text}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { icon: Globe, label: "등록 사이트", value: stats.total_sites, sub: stats.active_sites + "개 활성" },
              { icon: Link2, label: "상품 URL", value: sites.reduce((a, s) => a + (s.bmp_jsonld_urls?.[0]?.count || 0), 0), sub: "전체 등록" },
              { icon: Database, label: "Delivery 캐시", value: stats.delivery_cached, sub: "서빙 준비" },
              { icon: Package, label: "추출 완료", value: stats.total_extractions, sub: "누적" },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">
            {selectedSite ? selectedSite.site_domain + " — 상품 URL" : "등록 사이트"}
          </h2>
          <div className="flex gap-2">
            {selectedSite && (
              <button onClick={() => { setSelectedSite(null); setUrls([]); }}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                ← 사이트 목록
              </button>
            )}
            <button onClick={() => loadDashboard()}
              className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> 새로고침
            </button>
            <button onClick={triggerBatch}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> 배치 추출
            </button>
            {!selectedSite && (
              <button onClick={() => setShowAddSite(!showAddSite)}
                className="px-3 py-1.5 text-sm text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> 사이트 추가
              </button>
            )}
            {selectedSite && (
              <button onClick={() => setShowAddUrls(!showAddUrls)}
                className="px-3 py-1.5 text-sm text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> URL 추가
              </button>
            )}
          </div>
        </div>

        {/* Add site form */}
        {showAddSite && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h3 className="font-semibold text-sm mb-3">사이트 추가</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">도메인</label>
                <input type="text" value={newDomain} onChange={e => setNewDomain(e.target.value)}
                  placeholder="example.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">추출 소스</label>
                <select value={newSource} onChange={e => setNewSource(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="auto">자동 감지</option>
                  <option value="web_unlocker">Web Unlocker</option>
                  <option value="coupang_scraper">쿠팡 스크래퍼</option>
                  <option value="manual">수동</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">스케줄</label>
                <select value={newSchedule} onChange={e => setNewSchedule(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="manual">수동만</option>
                  <option value="6h">6시간</option>
                  <option value="12h">12시간</option>
                  <option value="24h">24시간</option>
                  <option value="7d">7일</option>
                </select>
              </div>
              <button onClick={addSite} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">추가</button>
              <button onClick={() => setShowAddSite(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">취소</button>
            </div>
          </div>
        )}

        {/* Add URLs form */}
        {showAddUrls && selectedSite && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h3 className="font-semibold text-sm mb-3">상품 URL 추가 — {selectedSite.site_domain}</h3>
            <textarea value={newUrls} onChange={e => setNewUrls(e.target.value)}
              placeholder={"https://" + selectedSite.site_domain + "/product/...\nhttps://" + selectedSite.site_domain + "/product/...\n(줄바꿈으로 여러 개)"}
              rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 font-mono" />
            <div className="flex gap-2">
              <button onClick={addUrls} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">추가</button>
              <button onClick={() => setShowAddUrls(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">취소</button>
            </div>
          </div>
        )}

        {/* Sites list */}
        {!selectedSite && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
            ) : sites.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">등록된 사이트가 없습니다</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">도메인</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">소스</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">스케줄</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">URL 수</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">마지막 배치</th>
                    <th className="text-center py-2.5 px-4 text-xs text-gray-500 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition cursor-pointer"
                      onClick={() => loadUrls(s)}>
                      <td className="py-3 px-4 font-medium text-gray-900">{s.site_domain}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{s.pdp_source}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{s.schedule_interval}</td>
                      <td className="py-3 px-4 text-gray-700">{s.bmp_jsonld_urls?.[0]?.count || 0}건</td>
                      <td className="py-3 px-4 text-xs text-gray-400">
                        {s.last_batch_at ? new Date(s.last_batch_at).toLocaleString("ko-KR") : "—"}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={e => { e.stopPropagation(); toggleSite(s); }}>
                        {s.is_pdp_enabled
                          ? <ToggleRight className="w-6 h-6 text-blue-600 mx-auto cursor-pointer hover:scale-110 transition" />
                          : <ToggleLeft className="w-6 h-6 text-gray-300 mx-auto cursor-pointer hover:scale-110 transition" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* URL list */}
        {selectedSite && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
            ) : urls.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">등록된 URL이 없습니다</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">상품 URL</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">상태</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">추출 일시</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-500 font-medium">에러</th>
                  </tr>
                </thead>
                <tbody>
                  {urls.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <a href={u.product_url} target="_blank" rel="noopener"
                          className="text-blue-600 hover:underline flex items-center gap-1 max-w-md truncate">
                          {u.product_url.replace(/^https?:\/\//, "").substring(0, 60)}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">
                        {u.last_extracted_at ? new Date(u.last_extracted_at).toLocaleString("ko-KR") : "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-red-400 max-w-xs truncate">
                        {u.error_message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 text-xs text-gray-400 flex items-center gap-4">
          <a href="/jsonld-tools" className="hover:text-gray-600 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> JSON-LD 도구
          </a>
          <span>•</span>
          <span>API: /api/pdp-admin, /api/jsonld-serve</span>
          <span>•</span>
          <span>WF: PDP-001 + PDP-SCHED</span>
        </div>
      </div>
    </div>
  );
}
