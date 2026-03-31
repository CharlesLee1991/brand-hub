"use client";
import { useState, useEffect, useCallback } from "react";

const API = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-jsonld-tools";

type Tab = "sites" | "validate" | "guide" | "extract";
interface Site { domain: string; pages: number; types: string[]; latest: string; }
interface Page { id: number; page_url: string; schema_types: string[]; validation_passed: boolean | null; }
interface Snippet {
  page_url: string; schema_types: string[];
  install_options: Record<string, { name: string; description: string; ai_visible: boolean; google_visible: boolean; code: string; }>;
}
interface PdpResult {
  success: boolean;
  completeness_score?: number;
  extraction_method?: string;
  needs_vision?: boolean;
  missing_fields?: string[];
  final_jsonld?: Record<string, unknown>;
  error?: string;
}
interface PdpHistory {
  id: string; url: string; site_domain: string; extraction_method: string;
  completeness_score: number; created_at: string;
  final_jsonld: Record<string, unknown> | null;
}

function Badge({ children, variant = "blue" }: { children: React.ReactNode; variant?: "blue" | "green" | "red" | "yellow" }) {
  const colors = { blue: "bg-blue-100 text-blue-800", green: "bg-green-100 text-green-800", red: "bg-red-100 text-red-800", yellow: "bg-yellow-100 text-yellow-800" };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mr-1 ${colors[variant]}`}>{children}</span>;
}

function CopyBtn({ targetId }: { targetId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const el = document.getElementById(targetId);
    if (el) { navigator.clipboard.writeText(el.textContent || ""); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };
  return <button onClick={copy} className="absolute top-2 right-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded">{copied ? "✅ 복사됨" : "복사"}</button>;
}

export default function JsonLdToolsPage() {
  const [tab, setTab] = useState<Tab>("sites");
  const [sites, setSites] = useState<Site[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentSite, setCurrentSite] = useState<string | null>(null);
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validateUrl, setValidateUrl] = useState("");
  const [validateResult, setValidateResult] = useState<any>(null);
  const [extractUrl, setExtractUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<PdpResult | null>(null);
  const [pdpHistory, setPdpHistory] = useState<PdpHistory[]>([]);
  const [showJsonld, setShowJsonld] = useState(false);

  const callApi = useCallback(async (params: Record<string, string>) => {
    const url = API + "?" + new URLSearchParams(params).toString();
    const res = await fetch(url);
    return res.json();
  }, []);

  // Load sites on mount
  useEffect(() => {
    setLoading(true);
    callApi({ action: "sites" }).then(d => {
      if (d.success) { setSites(d.sites); setTotal(d.total); }
      else setError("API 오류");
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [callApi]);

  const loadPages = async (domain: string) => {
    setCurrentSite(domain); setSnippet(null); setLoading(true); setError(null);
    try {
      const d = await callApi({ action: "pages", site: domain });
      if (d.success) setPages(d.pages);
      else setError("페이지 로딩 실패");
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const loadSnippet = async (id: number) => {
    setLoading(true); setError(null);
    try {
      const d = await callApi({ action: "snippet", id: String(id) });
      if (d.success) setSnippet(d);
      else setError("스니펫 로딩 실패");
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const doValidate = async () => {
    if (!validateUrl.trim()) return;
    setLoading(true); setValidateResult(null); setError(null);
    try {
      const d = await callApi({ action: "validate", url: validateUrl.trim() });
      setValidateResult(d);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const WEBHOOK = "/api/pdp-extract";
  const SUPA = "https://nntuztaehnywdbttrajy.supabase.co/rest/v1";
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const doExtract = async () => {
    if (!extractUrl.trim()) return;
    setExtracting(true); setExtractResult(null); setShowJsonld(false);
    try {
      const res = await fetch(WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: extractUrl.trim() }),
      });
      const d: PdpResult = await res.json();
      setExtractResult(d);
      if (d.success) loadHistory();
    } catch (e: any) {
      setExtractResult({ success: false, error: e.message });
    }
    setExtracting(false);
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(
        SUPA + "/bmp_jsonld_extractions?select=id,url,site_domain,extraction_method,completeness_score,created_at,final_jsonld&order=created_at.desc&limit=20",
        { headers: { apikey: ANON, Authorization: "Bearer " + ANON } }
      );
      const data = await res.json();
      if (Array.isArray(data)) setPdpHistory(data);
    } catch {}
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === "extract") loadHistory(); }, [tab]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-lg">
            <span className="text-slate-900">GEO</span><span className="text-red-600">care</span>
            <span className="text-slate-400 font-normal text-sm ml-2">JSON-LD 설치 가이드</span>
          </div>
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700">← bmp.ai</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b-2 border-slate-200 mb-6">
          {([["sites", "🌐 사이트 목록"], ["validate", "🔍 검증 도구"], ["extract", "🔬 PDP 추출"], ["guide", "📋 설치 가이드"]] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setCurrentSite(null); setSnippet(null); setValidateResult(null); }}
              className={`px-4 py-2 text-sm font-medium rounded-t transition ${tab === key ? "text-red-600 border-b-2 border-red-600 -mb-[2px]" : "text-slate-500 hover:bg-slate-100"}`}>
              {label}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">{error}</div>}

        {/* ═══ Sites Tab ═══ */}
        {tab === "sites" && !currentSite && !snippet && (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold mb-1">🌐 JSON-LD 생성 사이트 (총 {total}건)</h3>
            <p className="text-sm text-slate-500 mb-4">사이트를 클릭하면 페이지별 JSON-LD를 확인하고 설치 코드를 복사할 수 있습니다.</p>
            {loading ? <p className="text-center py-8 text-slate-400">로딩중...</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 text-xs text-slate-500 uppercase">도메인</th><th className="text-left py-2 text-xs text-slate-500 uppercase">페이지</th><th className="text-left py-2 text-xs text-slate-500 uppercase">Schema Types</th><th className="text-left py-2 text-xs text-slate-500 uppercase">최신</th></tr></thead>
                <tbody>{sites.map(s => (
                  <tr key={s.domain} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => loadPages(s.domain)}>
                    <td className="py-2.5 font-medium">{s.domain}</td>
                    <td className="py-2.5">{s.pages}</td>
                    <td className="py-2.5">{s.types.slice(0, 4).map(t => <Badge key={t}>{t}</Badge>)}{s.types.length > 4 && <span className="text-xs text-slate-400"> +{s.types.length - 4}</span>}</td>
                    <td className="py-2.5 text-slate-400 text-xs">{s.latest}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}

        {/* Pages */}
        {tab === "sites" && currentSite && !snippet && (
          <div>
            <button onClick={() => { setCurrentSite(null); setPages([]); }} className="mb-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm">← 목록으로</button>
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold mb-3">{currentSite} ({pages.length}건)</h3>
              {loading ? <p className="text-center py-8 text-slate-400">로딩중...</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left py-2 text-xs text-slate-500 uppercase">URL</th><th className="text-left py-2 text-xs text-slate-500 uppercase">Types</th><th className="text-left py-2 text-xs text-slate-500 uppercase">설치</th></tr></thead>
                  <tbody>{pages.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2.5 text-xs max-w-md truncate">{(p.page_url || "").replace(/^https?:\/\//, "").substring(0, 60)}</td>
                      <td className="py-2.5">{(p.schema_types || []).map(t => <Badge key={t}>{t}</Badge>)}</td>
                      <td className="py-2.5"><button onClick={() => loadSnippet(p.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded">코드</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Snippet */}
        {tab === "sites" && snippet && (
          <div>
            <button onClick={() => setSnippet(null)} className="mb-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm">← 페이지 목록</button>
            <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
              <h3 className="font-semibold mb-2">{snippet.page_url}</h3>
              <div>{(snippet.schema_types || []).map(t => <Badge key={t}>{t}</Badge>)}</div>
            </div>
            {Object.entries(snippet.install_options).map(([key, opt]) => (
              <div key={key} className="bg-white rounded-lg border border-slate-200 p-5 mb-3">
                <h4 className="font-semibold text-sm mb-1">{opt.name}</h4>
                <div className="flex gap-1 mb-2">
                  <Badge variant={opt.ai_visible ? "green" : "red"}>AI 크롤러 {opt.ai_visible ? "✅" : "❌"}</Badge>
                  <Badge variant={opt.google_visible ? "green" : "red"}>Google {opt.google_visible ? "✅" : "❌"}</Badge>
                </div>
                <p className="text-xs text-slate-500 mb-2">{opt.description}</p>
                <div className="relative">
                  <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap break-all"><code id={`code-${key}`}>{opt.code}</code></pre>
                  <CopyBtn targetId={`code-${key}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ Validate Tab ═══ */}
        {tab === "validate" && (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold mb-1">🔍 JSON-LD 검증 도구</h3>
            <p className="text-sm text-slate-500 mb-4">URL을 입력하면 해당 페이지에 JSON-LD가 존재하는지 확인합니다.</p>
            <div className="flex gap-2 mb-4">
              <input type="text" value={validateUrl} onChange={e => setValidateUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && doValidate()}
                placeholder="https://example.com/page" className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              <button onClick={doValidate} disabled={loading} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {loading ? "검증중..." : "검증"}
              </button>
            </div>
            {validateResult && (
              <div className="bg-slate-50 rounded-lg p-4 mt-2">
                <h4 className="font-semibold mb-2">{validateResult.recommendation || "결과"}</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div><p className="text-xs text-slate-500">페이지 내 JSON-LD</p><p className="font-bold">{validateResult.found_on_page}개</p></div>
                  <div><p className="text-xs text-slate-500">GEOcare DB</p><p className="font-bold">{validateResult.in_db ? "이력 있음" : "없음"}</p></div>
                </div>
                {validateResult.schemas_detected?.length > 0 && (
                  <div className="mt-3">{validateResult.schemas_detected.map((t: string, i: number) => <Badge key={i}>{t}</Badge>)}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ Extract Tab ═══ */}
        {tab === "extract" && (
          <div className="space-y-4">
            {/* 입력 + 추출 버튼 */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold mb-1">🔬 상품 PDP JSON-LD 자동 추출</h3>
              <p className="text-sm text-slate-500 mb-4">상품 URL을 입력하면 구조화된 JSON-LD 데이터를 자동으로 추출합니다.</p>
              <div className="flex gap-2">
                <input
                  type="url" value={extractUrl} onChange={(e) => setExtractUrl(e.target.value)}
                  placeholder="https://www.coupang.com/vp/products/... 또는 https://www.allbirds.com/products/..."
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  onKeyDown={(e) => { if (e.key === "Enter") doExtract(); }}
                  disabled={extracting}
                />
                <button onClick={doExtract} disabled={extracting || !extractUrl.trim()}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition whitespace-nowrap">
                  {extracting ? "추출 중..." : "추출"}
                </button>
              </div>
              {extracting && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  {extractUrl.includes("coupang.com") ? "쿠팡 스크래퍼 실행 중... (약 35초)" : "HTML 수집 + 파싱 중... (약 5~10초)"}
                </div>
              )}
              <div className="mt-3 flex gap-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">쿠팡 ✓</span>
                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">Shopify ✓</span>
                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">일반 사이트 ✓</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full">네이버 준비 중</span>
              </div>
            </div>

            {/* 결과 카드 */}
            {extractResult && (
              <div className={`rounded-lg border p-5 ${extractResult.success ? "bg-white border-green-200" : "bg-red-50 border-red-200"}`}>
                {extractResult.success && extractResult.final_jsonld ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-green-800">✅ 추출 완료</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{extractResult.extraction_method}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: (extractResult.completeness_score || 0) + "%",
                                background: (extractResult.completeness_score || 0) >= 80 ? "#10b981" : (extractResult.completeness_score || 0) >= 60 ? "#f59e0b" : "#ef4444"
                              }} />
                          </div>
                          <span className="text-sm font-bold" style={{
                            color: (extractResult.completeness_score || 0) >= 80 ? "#10b981" : (extractResult.completeness_score || 0) >= 60 ? "#f59e0b" : "#ef4444"
                          }}>{extractResult.completeness_score}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-[120px_1fr] gap-4">
                      {/* 이미지 */}
                      {(extractResult.final_jsonld.image as string) && (
                        <div className="w-[120px] h-[120px] rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          <img
                            src={Array.isArray(extractResult.final_jsonld.image) ? (extractResult.final_jsonld.image as string[])[0] : extractResult.final_jsonld.image as string}
                            alt="" className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
                      )}
                      {/* 상품 정보 */}
                      <div className="space-y-1.5 text-sm">
                        <div><span className="text-slate-400 w-16 inline-block">상품명</span> <span className="font-medium text-slate-900">{String(extractResult.final_jsonld.name || "-")}</span></div>
                        {(extractResult.final_jsonld.brand as Record<string, string>)?.name && (
                          <div><span className="text-slate-400 w-16 inline-block">브랜드</span> <span className="text-slate-700">{(extractResult.final_jsonld.brand as Record<string, string>).name}</span></div>
                        )}
                        {!!(extractResult.final_jsonld.offers as Record<string, unknown>)?.price && (
                          <div><span className="text-slate-400 w-16 inline-block">가격</span> <span className="font-semibold text-red-600">
                            {String((extractResult.final_jsonld.offers as Record<string, string>).priceCurrency) === "KRW" ? "₩" : "$"}
                            {Number((extractResult.final_jsonld.offers as Record<string, unknown>).price).toLocaleString()}
                          </span></div>
                        )}
                        {!!(extractResult.final_jsonld.aggregateRating as Record<string, unknown>)?.ratingValue && (
                          <div><span className="text-slate-400 w-16 inline-block">평점</span> <span className="text-slate-700">
                            {"⭐ " + String((extractResult.final_jsonld.aggregateRating as Record<string, unknown>).ratingValue)}
                            {!!(extractResult.final_jsonld.aggregateRating as Record<string, unknown>).reviewCount && (
                              <span className="text-slate-400 ml-1">({String((extractResult.final_jsonld.aggregateRating as Record<string, unknown>).reviewCount)}개)</span>
                            )}
                          </span></div>
                        )}
                      </div>
                    </div>
                    {/* JSON-LD 토글 */}
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <button onClick={() => setShowJsonld(!showJsonld)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                        {showJsonld ? "▼ JSON-LD 접기" : "▶ JSON-LD 보기"}
                      </button>
                      {showJsonld && (
                        <pre className="mt-2 bg-slate-800 text-slate-200 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                          {JSON.stringify(extractResult.final_jsonld, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">❌ 추출 실패</h3>
                    <p className="text-sm text-red-600">{extractResult.error || "알 수 없는 오류"}</p>
                  </div>
                )}
              </div>
            )}

            {/* 히스토리 */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold mb-3">📋 추출 히스토리</h3>
              {pdpHistory.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">아직 추출 기록이 없습니다</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b">
                    <th className="text-left py-2 text-xs text-slate-500 uppercase">URL</th>
                    <th className="text-left py-2 text-xs text-slate-500 uppercase">도메인</th>
                    <th className="text-left py-2 text-xs text-slate-500 uppercase">방법</th>
                    <th className="text-left py-2 text-xs text-slate-500 uppercase">완성도</th>
                    <th className="text-left py-2 text-xs text-slate-500 uppercase">일시</th>
                  </tr></thead>
                  <tbody>{pdpHistory.map(h => (
                    <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => { setExtractUrl(h.url); if (h.final_jsonld) setExtractResult({ success: true, completeness_score: h.completeness_score, extraction_method: h.extraction_method, final_jsonld: h.final_jsonld }); }}>
                      <td className="py-2.5 text-xs max-w-[200px] truncate">{h.url.replace(/^https?:\/\//, "").substring(0, 50)}</td>
                      <td className="py-2.5 text-xs">{h.site_domain}</td>
                      <td className="py-2.5"><Badge variant={h.extraction_method === "brightdata_scraper" ? "blue" : "green"}>{h.extraction_method}</Badge></td>
                      <td className="py-2.5">
                        <span className={`font-semibold ${h.completeness_score >= 80 ? "text-green-600" : h.completeness_score >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                          {h.completeness_score}%
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-slate-400">{new Date(h.created_at).toLocaleDateString("ko-KR")}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ═══ Guide Tab ═══ */}
        {tab === "guide" && (
          <div className="space-y-4">
            {/* 개요 */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold mb-2">JSON-LD 설치 가이드</h3>
              <p className="text-sm text-slate-500 mb-4">GEOcare가 생성한 JSON-LD를 고객 사이트에 적용하는 두 가지 방법입니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-yellow-500 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-700 mb-1">방법 1: GTM 설치</h4>
                  <p className="text-sm text-slate-600 mb-2">Google Tag Manager만 있으면 가능</p>
                  <div className="flex gap-1"><Badge variant="red">AI 크롤러 ❌</Badge><Badge variant="green">Google ✅</Badge></div>
                  <p className="text-xs text-slate-500 mt-2">GTM은 JavaScript 실행이므로 AI 크롤러는 못 봅니다.</p>
                </div>
                <div className="border-2 border-green-500 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-1">방법 2: 서버사이드 설치 (권장)</h4>
                  <p className="text-sm text-slate-600 mb-2">개발팀이 소스코드에 직접 삽입 또는 API 호출</p>
                  <div className="flex gap-1"><Badge variant="green">AI 크롤러 ✅</Badge><Badge variant="green">Google ✅</Badge></div>
                  <p className="text-xs text-slate-500 mt-2">서버에서 HTML에 직접 삽입하여 모두 인식합니다.</p>
                </div>
              </div>
            </div>

            {/* GTM */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold mb-3">🏷️ 방법 1: GTM(Google Tag Manager) 설치</h3>
              <p className="text-sm text-slate-500 mb-4">개발 리소스 없이 마케터가 직접 설치할 수 있습니다.</p>
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-1">Step 1. JSON-LD 코드 준비</h4>
                  <p className="text-xs text-slate-500">&quot;사이트 목록&quot; 탭에서 해당 페이지의 &quot;코드&quot; 버튼 → &quot;GTM 커스텀 HTML&quot; 코드를 복사합니다.</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-1">Step 2. GTM 태그 생성</h4>
                  <div className="relative">
                    <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed"><code id="g-gtm">{`1. GTM 접속 → 태그 → 새로 만들기
2. 태그 유형: 커스텀 HTML
3. 복사한 JSON-LD 코드 붙여넣기
4. 트리거: Page View (All Pages) 또는 특정 URL 패턴
5. 저장 → 제출 → 게시`}</code></pre>
                    <CopyBtn targetId="g-gtm" />
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-1">Step 3. 확인</h4>
                  <p className="text-xs text-slate-500"><a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener" className="text-red-600 underline">Google Rich Results Test</a>에서 확인하거나, &quot;검증 도구&quot; 탭에서 확인합니다.</p>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg mt-3">
                <p className="text-xs text-yellow-800"><strong>⚠️ GTM 한계:</strong> AI 크롤러(GPTBot, ClaudeBot, PerplexityBot)는 JavaScript를 실행하지 않으므로 GTM으로 삽입한 JSON-LD를 볼 수 없습니다. AI 검색에서의 인용을 원하면 방법 2를 사용하세요.</p>
              </div>
            </div>

            {/* 서버사이드 */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold mb-3">🚀 방법 2: 서버사이드 설치 (권장)</h3>
              <p className="text-sm text-slate-500 mb-4">AI 크롤러 + Google 모두 인식합니다.</p>

              <div className="border border-slate-200 rounded-lg p-4 mb-3">
                <h4 className="font-semibold text-sm mb-1">2-A. 소스코드에 직접 삽입 (가장 간단)</h4>
                <p className="text-xs text-slate-500 mb-2">&quot;사이트 목록&quot; 탭에서 복사한 JSON-LD 코드를 HTML &lt;head&gt; 안에 붙여넣습니다.</p>
                <div className="relative">
                  <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed whitespace-pre-wrap"><code id="g-direct">{`<head>
  <meta charset="UTF-8">
  <title>페이지 제목</title>

  <!-- GEOcare.AI JSON-LD (여기에 붙여넣기) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "브랜드명",
    "url": "https://example.com"
  }
  </script>
</head>`}</code></pre>
                  <CopyBtn targetId="g-direct" />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 mb-3">
                <h4 className="font-semibold text-sm mb-1">2-B. GEOcare API 호출 (자동 업데이트)</h4>
                <p className="text-xs text-slate-500 mb-3">서버에서 API를 호출하면 JSON-LD가 업데이트될 때 자동으로 최신 버전이 적용됩니다.</p>

                <p className="text-xs font-semibold text-slate-700 mb-1">API 엔드포인트:</p>
                <div className="relative mb-3">
                  <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg text-xs"><code id="g-api">{`GET https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-jsonld?url={페이지URL}`}</code></pre>
                  <CopyBtn targetId="g-api" />
                </div>

                <p className="text-xs font-semibold text-slate-700 mb-1">PHP:</p>
                <div className="relative mb-3">
                  <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap"><code id="g-php">{`<?php
$url = urlencode($_SERVER["REQUEST_URI"]);
$api = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-jsonld?url=https://mysite.com" . $url;
$resp = json_decode(file_get_contents($api), true);
if ($resp["success"] && $resp["data"]) {
  echo '<script type="application/ld+json">' . json_encode($resp["data"]) . '</script>';
}
?>`}</code></pre>
                  <CopyBtn targetId="g-php" />
                </div>

                <p className="text-xs font-semibold text-slate-700 mb-1">Next.js / React:</p>
                <div className="relative mb-3">
                  <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap"><code id="g-node">{`// app/layout.tsx
const pageUrl = encodeURIComponent("https://mysite.com" + pathname);
const res = await fetch(
  \`https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-jsonld?url=\${pageUrl}\`
);
const { success, data } = await res.json();
if (success && data) {
  return <script type="application/ld+json"
    dangerouslySetInnerHTML={{__html: JSON.stringify(data)}} />
}`}</code></pre>
                  <CopyBtn targetId="g-node" />
                </div>

                <p className="text-xs font-semibold text-slate-700 mb-1">Python (Django/Flask):</p>
                <div className="relative">
                  <pre className="bg-slate-800 text-slate-200 p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap"><code id="g-python">{`import requests, json

def get_jsonld(page_url):
    api = f"https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-jsonld?url={page_url}"
    resp = requests.get(api).json()
    if resp.get("success") and resp.get("data"):
        return f'<script type="application/ld+json">{json.dumps(resp["data"])}</script>'
    return ""`}</code></pre>
                  <CopyBtn targetId="g-python" />
                </div>
              </div>
            </div>

            {/* 비교표 */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold mb-3">📊 방법별 비교</h3>
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 text-xs text-slate-500">항목</th><th className="text-left py-2 text-xs text-slate-500">GTM</th><th className="text-left py-2 text-xs text-slate-500">소스코드 직접</th><th className="text-left py-2 text-xs text-slate-500">API 호출</th></tr></thead>
                <tbody>
                  <tr className="border-b border-slate-100"><td className="py-2">AI 크롤러</td><td><Badge variant="red">❌</Badge></td><td><Badge variant="green">✅</Badge></td><td><Badge variant="green">✅</Badge></td></tr>
                  <tr className="border-b border-slate-100"><td className="py-2">Google</td><td><Badge variant="green">✅</Badge></td><td><Badge variant="green">✅</Badge></td><td><Badge variant="green">✅</Badge></td></tr>
                  <tr className="border-b border-slate-100"><td className="py-2">개발 필요</td><td>없음</td><td>최소</td><td>중간</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-2">자동 업데이트</td><td>수동</td><td>수동</td><td><Badge variant="green">자동</Badge></td></tr>
                  <tr><td className="py-2">추천 대상</td><td>마케터</td><td>개발팀</td><td>개발팀</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
