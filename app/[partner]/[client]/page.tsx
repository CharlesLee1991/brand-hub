"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  Bot,
  Send,
  Loader2,
  FileText,
  Shield,
  TrendingUp,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  BarChart3,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Star,
  MessageSquare,
  Wand2,
  LogOut,
  Activity,
  Target,
  Zap,
  Play,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

/* ────── Types ────── */
interface HubConfig {
  hub_slug: string;
  brand_name: string;
  brand_description: string;
  primary_color: string;
  logo_url: string | null;
}

interface EEATAnalysis {
  slug: string;
  url: string;
  industry: string;
  scorecard: {
    overall_score: number;
    overall_grade: string;
    experience: { score: number; evidence: string[]; gaps: string[] };
    expertise: { score: number; evidence: string[]; gaps: string[] };
    authoritativeness: { score: number; evidence: string[]; gaps: string[] };
    trustworthiness: { score: number; evidence: string[]; gaps: string[] };
  };
  action_plan?: {
    strengths?: string[];
    weaknesses?: string[];
    priority_actions?: { action: string; priority: number; effort: string; eeat_impact?: string }[];
  };
}

interface PageScore {
  url: string;
  overall_score: number;
  experience: number;
  expertise: number;
  authoritativeness: number;
  trustworthiness: number;
}

interface Compliance {
  total_items: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  violations: any[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; document_id: string }[];
  isLoading?: boolean;
}

/* ────── EEAT Score Bar Component ────── */
function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-600 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold w-10 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

/* ────── Grade Badge ────── */
function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const colors: Record<string, string> = {
    A: "from-emerald-500 to-green-600",
    B: "from-blue-500 to-indigo-600",
    C: "from-amber-500 to-orange-600",
    D: "from-red-500 to-rose-600",
  };
  return (
    <div className="text-center">
      <div
        className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${
          colors[grade] || colors.B
        } text-white shadow-lg`}
      >
        <span className="text-3xl font-black">{grade}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{score}</p>
      <p className="text-xs text-gray-500 uppercase tracking-wider">Overall Score</p>
    </div>
  );
}

/* ────── Service Package Card ────── */
function PackageCard({
  tier,
  name,
  price,
  features,
  highlight,
  color,
}: {
  tier: string;
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
  color: string;
}) {
  return (
    <div
      className={`rounded-2xl p-6 border-2 transition-all ${
        highlight
          ? "border-current shadow-xl scale-[1.02] bg-white"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
      style={highlight ? { borderColor: color } : {}}
    >
      {highlight && (
        <span
          className="inline-block text-xs font-bold uppercase tracking-wider text-white px-3 py-1 rounded-full mb-3"
          style={{ backgroundColor: color }}
        >
          추천
        </span>
      )}
      <h3 className="text-lg font-bold text-gray-900">{tier}</h3>
      <p className="text-sm text-gray-500 mt-1">{name}</p>
      <p className="text-2xl font-black mt-3" style={{ color }}>
        {price}
      </p>
      <ul className="mt-4 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color }} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ────── EEAT Report Inline (fetch + srcdoc) ────── */
function EeatReportInline({ efUrl, clientSlug }: { efUrl: string; clientSlug: string }) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`${efUrl}/geobh-eeat-report?slug=${clientSlug}`)
      .then((res) => res.text())
      .then((text) => {
        setHtml(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [efUrl, clientSlug]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }
  if (!html) return null;

  return (
    <section className="bg-white rounded-2xl border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <h4 className="font-bold text-gray-900">EEAT 전체 리포트</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const blob = new Blob([html], { type: "text/html;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `eeat-report-${clientSlug}.html`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
          >
            다운로드
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t" style={{ height: "calc(100vh - 200px)" }}>
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            title="EEAT Report"
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </section>
  );
}

/* ────── Citation Moat Tab (fetch + srcdoc) ────── */
function CitationMoatTab({ efUrl, clientSlug }: { efUrl: string; clientSlug: string }) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${efUrl}/geobh-moat-report?slug=${clientSlug}`)
      .then((res) => res.text())
      .then((text) => {
        setHtml(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [efUrl, clientSlug]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">🛡️ Citation Moat™ 리포트</h2>
          <p className="text-sm text-gray-500 mt-1">AI 검색엔진이 이 브랜드를 얼마나 신뢰하고 인용하는지 분석합니다.</p>
        </div>
        <button
          onClick={() => {
            if (!html) return;
            const blob = new Blob([html], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `citation-moat-${clientSlug}.html`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={!html}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5 disabled:opacity-40"
        >
          <FileText className="w-3.5 h-3.5" />
          다운로드
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : (
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            title="Citation Moat Report"
            sandbox="allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}

/* ────── Generic Report Iframe Tab ────── */
function ReportIframeTab({
  efUrl,
  clientSlug,
  efSlug,
  title,
  subtitle,
  icon,
  downloadName,
}: {
  efUrl: string;
  clientSlug: string;
  efSlug: string;
  title: string;
  subtitle: string;
  icon: string;
  downloadName: string;
}) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(efUrl + "/" + efSlug + "?slug=" + clientSlug)
      .then((res) => res.text())
      .then((text) => { setHtml(text); setLoading(false); })
      .catch(() => setLoading(false));
  }, [efUrl, clientSlug, efSlug]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{icon} {title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => {
            if (!html) return;
            const blob = new Blob([html], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadName + "-" + clientSlug + ".html";
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={!html}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5 disabled:opacity-40"
        >
          <FileText className="w-3.5 h-3.5" />
          다운로드
        </button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : (
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            title={title}
            sandbox="allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}

/* ────── AI Commentary Panel (3-LLM insights) ────── */
function AiCommentaryPanel({
  tab, slug, data, brandName, industry, color,
}: {
  tab: string; slug: string; data: any; brandName: string; industry: string; color: string;
}) {
  const [commentary, setCommentary] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeLlm, setActiveLlm] = useState<"claude" | "gpt" | "gemini">("claude");
  const [expanded, setExpanded] = useState(false);
  const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";

  const llms = [
    { key: "claude" as const, name: "Claude", clr: "#d97706", icon: "🟠" },
    { key: "gpt" as const, name: "GPT-4o", clr: "#10a37f", icon: "🟢" },
  ];

  const fetchCommentary = async () => {
    if (commentary) { setExpanded(true); return; }
    setLoading(true); setExpanded(true);
    try {
      const res = await fetch(`${BAWEE_EF}/geobh-ai-commentary`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab, slug, data, brand_name: brandName, industry }),
      });
      const d = await res.json();
      if (d.success) setCommentary(d.commentary);
    } catch {}
    setLoading(false);
  };

  if (!expanded) {
    return (
      <button onClick={fetchCommentary} disabled={loading}
        className="w-full bg-white border border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm text-gray-500">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
        {loading ? "AI 의견 생성 중..." : "🤖 AI 진단 의견 보기 — Claude · GPT-4o 비교"}
      </button>
    );
  }

  return (
    <section className="bg-white rounded-2xl border overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" style={{ color }} />
          <h3 className="font-bold text-gray-900 text-sm">AI 진단 의견</h3>
        </div>
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-400 hover:text-gray-600">접기</button>
      </div>
      <div className="flex gap-1 px-5 mb-3">
        {llms.map(l => (
          <button key={l.key} onClick={() => setActiveLlm(l.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeLlm === l.key ? "text-white" : "text-gray-500 bg-gray-100 hover:bg-gray-200"}`}
            style={activeLlm === l.key ? { backgroundColor: l.clr } : {}}>
            {l.icon} {l.name}
          </button>
        ))}
      </div>
      <div className="px-5 pb-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            <span className="ml-2 text-sm text-gray-400">AI가 분석 중입니다...</span>
          </div>
        ) : commentary ? (
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            <ReactMarkdown>{commentary[activeLlm] || "데이터 없음"}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">의견을 불러올 수 없습니다.</p>
        )}
      </div>
    </section>
  );
}

/* ────── Main Page Component ────── */
export default function ClientPage() {
  const { partner, client } = useParams() as { partner: string; client: string };
  const router = useRouter();
  const { user, loading: authLoading, canAccess, signOut, displayName, isAdmin } = useAuth();

  // Data states
  const [hubConfig, setHubConfig] = useState<HubConfig | null>(null);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [eeatData, setEeatData] = useState<{
    analysis: EEATAnalysis;
    page_scores: PageScore[];
    compliance: Compliance | null;
    client_analyses: { slug: string; url: string; industry: string; score: number; grade: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"overview" | "analysis" | "citation" | "som" | "compliance" | "competitor" | "contentlab" | "services" | "chat">("overview");

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Page scores expand
  const [showAllPages, setShowAllPages] = useState(false);
  const [somData, setSomData] = useState<any>(null);
  const [somLoading, setSomLoading] = useState(false);
  const [somFetched, setSomFetched] = useState(false);

  // GEO Report (Authority Index)
  const [geoReport, setGeoReport] = useState<any>(null);
  const [geoReportLoading, setGeoReportLoading] = useState(true);

  // KHub AI Recommendations
  const [khubRecs, setKhubRecs] = useState<any>(null);
  const [khubRecsLoading, setKhubRecsLoading] = useState(false);
  const [khubRecsSection, setKhubRecsSection] = useState<string>("");

  // Partner Memo
  const [memoText, setMemoText] = useState("");
  const [memoSaving, setMemoSaving] = useState(false);
  const [memoSaved, setMemoSaved] = useState(false);

  // Content Lab state
  const [clSelectedType, setClSelectedType] = useState<string | null>(null);
  const [clSelectedLlm, setClSelectedLlm] = useState<string | null>(null);
  const [clGenLoading, setClGenLoading] = useState(false);
  const [clGenResult, setClGenResult] = useState<any>(null);
  const [clHistory, setClHistory] = useState<any[]>([]);

  const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";

  // Analysis status & trigger
  const [analysisStatus, setAnalysisStatus] = useState<any>(null);
  const [triggerLoading, setTriggerLoading] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<{ type: string; success: boolean; message: string } | null>(null);

  const triggerEEAT = async () => {
    const url = analysisStatus?.brand?.site_domain;
    if (!url) return;
    setTriggerLoading("eeat"); setTriggerResult(null);
    try {
      const res = await fetch(`${BAWEE_EF}/geobh-api/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, slug: client, industry: analysisStatus?.brand?.industry }) });
      const data = await res.json();
      setTriggerResult({ type: "eeat", success: data.success, message: data.success ? "EEAT 분석이 시작되었습니다. 1~3분 후 새로고침하세요." : "분석 트리거 실패" });
    } catch { setTriggerResult({ type: "eeat", success: false, message: "요청 실패" }); }
    setTriggerLoading(null);
  };

  const triggerReport = async (target: string) => {
    const site_domain = analysisStatus?.brand?.site_domain;
    if (!site_domain) return;
    setTriggerLoading(target); setTriggerResult(null);
    try {
      const res = await fetch(`${BAWEE_EF}/geobh-api/generate-report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site_domain, target, force_refresh: true }) });
      const data = await res.json();
      const labels: Record<string, string> = { citation: "Citation Moat", competitor: "경쟁사 벤치마크", report: "종합 리포트" };
      setTriggerResult({ type: target, success: data.success, message: data.success ? `${labels[target] || target} 리포트 생성이 시작되었습니다. 잠시 후 새로고침하세요.` : "리포트 생성 실패" });
    } catch { setTriggerResult({ type: target, success: false, message: "요청 실패" }); }
    setTriggerLoading(null);
  };
  /* ── Subdomain detection ── */
  useEffect(() => {
    const host = window.location.hostname;
    const isSub = (host.endsWith('.bmp.ai') || host.endsWith('.vercel.app')) && host.split('.').length > 2;
    setIsSubdomain(isSub);
  }, []);

  /* ── Load hub config + EEAT data ── */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Hub config (partner의 config 로드)
        const configRes = await fetch(`${BAWEE_EF}/geobh-data?slug=${partner}`);
        const configData = await configRes.json();
        if (configData.success !== false && configData.config) {
          setHubConfig(configData.config);
        }

        // 2. EEAT data (client slug로 직접 조회)
        const eeatRes = await fetch(`${BAWEE_EF}/geobh-eeat?slug=${client}`);
        const eeat = await eeatRes.json();
        if (eeat.success) {
          setEeatData(eeat);
        }

        // 3. GEO Report (Authority Index)
        try {
          const geoRes = await fetch(`${BAWEE_EF}/geobh-geo-report?slug=${client}&format=json`);
          const geo = await geoRes.json();
          if (geo.authority_index !== undefined) setGeoReport(geo);
        } catch {} finally {
          setGeoReportLoading(false);
        }

        // 4. Analysis status (for trigger buttons)
        try {
          const statusRes = await fetch(`${BAWEE_EF}/geobh-api/analysis-status?slug=${client}`);
          const status = await statusRes.json();
          if (status.success) setAnalysisStatus(status);
        } catch {}
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [partner, client]);

  /* ── Chat scroll ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── SoM lazy fetch ── */
  useEffect(() => {
    if (activeSection === "som" && !somFetched && client) {
      setSomLoading(true);
      fetch(`${BAWEE_EF}/geobh-som?slug=${client}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setSomData(data);
          setSomFetched(true);
          setSomLoading(false);
        })
        .catch(() => { setSomFetched(true); setSomLoading(false); });
    }
  }, [activeSection, somFetched, client]);

  /* ── KHub Recommendations — fetch when section changes ── */
  const sectionMap: Record<string, string> = {
    analysis: "eeat", citation: "citation", som: "som",
    overview: "all", compliance: "all", competitor: "all",
  };
  useEffect(() => {
    const sec = sectionMap[activeSection];
    if (!sec || !client || khubRecsSection === activeSection) return;
    setKhubRecsLoading(true);
    fetch(`${BAWEE_EF}/geobh-khub-bridge/recommend?client=${client}&partner=${partner}&section=${sec}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setKhubRecs(data);
        setKhubRecsSection(activeSection);
      })
      .catch(() => {})
      .finally(() => setKhubRecsLoading(false));
  }, [activeSection, client, partner]);

  /* ── Partner Memo Save ── */
  const handleMemoSave = async () => {
    if (!memoText.trim() || memoSaving) return;
    setMemoSaving(true);
    setMemoSaved(false);
    try {
      const res = await fetch("https://bawee.app.n8n.cloud/webhook/phase3-memo-to-khub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_slug: client,
          client_name: eeatData?.analysis?.url?.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "") || client,
          partner_slug: partner,
          action_status: "in_progress",
          note: memoText.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMemoSaved(true);
        setMemoText("");
        setTimeout(() => setMemoSaved(false), 3000);
      }
    } catch {}
    setMemoSaving(false);
  };

  /* ── Chat submit ── */
  const handleChat = async (query: string) => {
    if (!query.trim() || chatLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: query.trim() };
    const loadingMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      isLoading: true,
    };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${BAWEE_EF}/khub-query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_code: partner, query: query.trim(), include_sources: true }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.success ? data.answer : "죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.",
        sources: data.sources?.map((s: any) => ({ title: s.title, document_id: s.document_id })),
      };
      setMessages((prev) => prev.map((m) => (m.isLoading ? assistantMsg : m)));
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading ? { ...m, content: "네트워크 오류가 발생했습니다.", isLoading: false } : m,
        ),
      );
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  };

  /* ── Auth loading state ── */
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  /* ── Auth check ── */
  if (!user) {
    router.replace("/login?redirect=/" + partner + "/" + client);
    return null;
  }

  if (!canAccess(partner, client)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-gray-600 mb-2">접근 권한이 없습니다.</p>
          <p className="text-sm text-gray-400 mb-6">이 고객사에 대한 열람 권한이 없습니다.</p>
          <button onClick={() => signOut().then(() => router.replace("/login"))} className="text-blue-600 hover:underline text-sm">다른 계정으로 로그인</button>
        </div>
      </div>
    );
  }

  /* ── Data loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  /* ── 404 state ── */
  if (!hubConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-6">등록되지 않은 파트너입니다.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const color = hubConfig.primary_color || "#3B82F6";
  const sc = eeatData?.analysis?.scorecard;

  const tabs = [
    { key: "overview", label: "종합 진단", icon: Activity },
    { key: "analysis", label: "EEAT 분석", icon: Shield },
    { key: "citation", label: "Citation Moat", icon: Award },
    { key: "som", label: "SoM 점유율", icon: BarChart3 },
    { key: "compliance", label: "컴플라이언스", icon: AlertTriangle },
    { key: "competitor", label: "경쟁사", icon: Target },
    { key: "contentlab", label: "콘텐츠 랩", icon: Wand2 },
    { key: "services", label: "서비스", icon: Award },
    { key: "chat", label: "AI 어시스턴트", icon: MessageSquare },
  ] as const;

  const suggestedQuestions = [
    `${eeatData?.analysis?.url ? eeatData.analysis.url.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "") : client} EEAT 점수는?`,
    "PR-GEO 통합 서비스가 뭔가요?",
    "GEO 최적화 방법 알려줘",
    "경쟁사 대비 우리 브랜드 현황은?",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ════ Header ════ */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href={isSubdomain ? "/" : `/${partner}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href={isSubdomain ? "/" : `/${partner}`} className="hover:opacity-80 transition-opacity">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
          </Link>
          <Link href={isSubdomain ? "/" : `/${partner}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
              <span>{hubConfig.brand_name}</span>
              <span>›</span>
              <span className="text-gray-600 font-medium">{eeatData?.analysis?.url?.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "") || client}</span>
            </div>
            <h1 className="font-bold text-gray-900 truncate">
              {eeatData?.analysis?.industry ? eeatData.analysis.industry + " — " : ""}{client}
            </h1>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 hidden sm:inline">{displayName || user?.email}</span>
            {isAdmin && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Admin</span>}
            <button onClick={() => signOut().then(() => router.replace("/login"))} className="text-gray-400 hover:text-gray-600" title="로그아웃">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === tab.key
                    ? "border-current text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                style={activeSection === tab.key ? { color } : {}}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ════ Content ════ */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* ──── OVERVIEW TAB — Authority Index ──── */}
        {activeSection === "overview" && (
          <div className="space-y-8">
            {/* AI Commentary — Overview Top */}
            {(geoReport || eeatData) && (
              <AiCommentaryPanel tab="overview" slug={client} brandName={hubConfig?.brand_name || client} industry={eeatData?.analysis?.industry || ""} color={color}
                data={{ authority_index: geoReport?.authority_index, authority_grade: geoReport?.authority_grade, pillars: geoReport?.pillars, eeat_score: sc?.overall_score, som_share: somData?.latest?.overall_share }} />
            )}
            {/* Authority Index Hero */}
            {geoReport ? (() => {
              const ai = geoReport.authority_index;
              const ag = geoReport.authority_grade;
              const p = geoReport.pillars || {};
              const gradeColor: Record<string, string> = { A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#ef4444" };
              const gc = gradeColor[ag] || "#3b82f6";
              const gradeLabel: Record<string, string> = { A: "Strong Authority", B: "Growing", C: "Emerging", D: "Needs Work" };
              return (
                <>
                  <section className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${gc}18, ${gc}08)` }}>
                    <div className="p-8">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-5 h-5" style={{ color: gc }} />
                        <span className="text-sm font-bold uppercase tracking-wider" style={{ color: gc }}>Authority Index™</span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {geoReport.brand_name || client} — 종합 GEO 진단
                      </h2>
                      <p className="text-sm text-gray-500">{geoReport.industry} · {geoReport.analysis_date}</p>

                      {/* Score Ring + Pillars */}
                      <div className="mt-6 flex flex-col md:flex-row items-center gap-8">
                        {/* Ring */}
                        <div className="relative w-40 h-40 flex-shrink-0">
                          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                            <circle cx="60" cy="60" r="52" fill="none" stroke={gc} strokeWidth="10"
                              strokeDasharray={`${(ai / 100) * 327} 327`} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black" style={{ color: gc }}>{ai}</span>
                            <span className="text-xs font-bold text-gray-500">{gradeLabel[ag] || ag}</span>
                          </div>
                        </div>

                        {/* 5 Pillar Bars */}
                        <div className="flex-1 w-full space-y-3">
                          {[
                            { key: "eeat", label: "E-E-A-T", score: p.eeat?.score, weight: "30%", clr: "#8b5cf6" },
                            { key: "som", label: "SoM 점유율", score: p.som?.score || p.som?.share, weight: "25%", clr: "#3b82f6" },
                            { key: "citation_moat", label: "Citation Moat", score: p.citation_moat?.score, weight: "25%", clr: "#10b981" },
                            { key: "compliance", label: "컴플라이언스", score: p.compliance?.score, weight: "10%", clr: "#f59e0b" },
                            { key: "competitive", label: "경쟁 우위", score: p.competitive?.self_share != null ? Math.round(p.competitive.self_share) : null, weight: "10%", clr: "#ef4444" },
                          ].map((pill) => (
                            <div key={pill.key} className="flex items-center gap-3">
                              <span className="text-xs font-medium text-gray-500 w-24 shrink-0 text-right">{pill.label}</span>
                              <div className="flex-1 bg-white/60 rounded-full h-2.5 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pill.score ?? 0}%`, backgroundColor: pill.clr }} />
                              </div>
                              <span className="text-xs font-bold w-8 text-right" style={{ color: pill.clr }}>{pill.score ?? "—"}</span>
                              <span className="text-[10px] text-gray-400 w-7">{pill.weight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 5 Pillar Cards → click to tab */}
                  <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">5대 진단 필라</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {[
                        { tab: "analysis" as const, icon: "📋", label: "E-E-A-T", score: p.eeat?.score, grade: p.eeat?.grade, desc: "경험·전문·권위·신뢰", clr: "#8b5cf6" },
                        { tab: "som" as const, icon: "📊", label: "SoM 점유율", score: p.som?.score || p.som?.share, grade: null, desc: `Top3 ${p.som?.top3_rate ?? 0}%`, clr: "#3b82f6" },
                        { tab: "citation" as const, icon: "🛡️", label: "Citation Moat", score: p.citation_moat?.score, grade: p.citation_moat?.grade, desc: `인용률 ${p.citation_moat?.citation_rate ?? 0}%`, clr: "#10b981" },
                        { tab: "compliance" as const, icon: "⚖️", label: "컴플라이언스", score: p.compliance?.score, grade: null, desc: `HIGH ${p.compliance?.high_risk ?? 0} · MED ${p.compliance?.medium_risk ?? 0}`, clr: "#f59e0b" },
                        { tab: "competitor" as const, icon: "🎯", label: "경쟁사 벤치마크", score: p.competitive?.self_share != null ? Math.round(p.competitive.self_share) : null, grade: null, desc: p.competitive?.top_competitor ? `vs ${p.competitive.top_competitor.name}` : "경쟁사 비교", clr: "#ef4444" },
                      ].map((card) => (
                        <button
                          key={card.tab}
                          onClick={() => setActiveSection(card.tab)}
                          className="bg-white rounded-xl border p-4 text-left hover:shadow-md hover:border-gray-300 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg">{card.icon}</span>
                            {card.grade && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: card.clr }}>{card.grade}</span>
                            )}
                          </div>
                          <p className="text-2xl font-black" style={{ color: card.clr }}>{card.score ?? "—"}</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{card.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Competitor Mini */}
                  {p.competitive?.top_competitor && (
                    <section className="bg-white rounded-xl border p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <Target className="w-4 h-4 text-red-500" /> 주요 경쟁사
                        </h4>
                        <button onClick={() => setActiveSection("competitor")} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          상세 보기 <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{geoReport.brand_name || client}</span>
                            <span className="text-sm font-bold" style={{ color }}>{p.competitive.self_share}%</span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-2.5">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(p.competitive.self_share, 100)}%`, backgroundColor: color }} />
                          </div>
                        </div>
                        <span className="text-gray-300 text-lg font-light">vs</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{p.competitive.top_competitor.name}</span>
                            <span className="text-sm font-bold text-red-500">{p.competitive.top_competitor.share}%</span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-2.5">
                            <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(p.competitive.top_competitor.share, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* 6 Report Downloads */}
                  <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📥 진단 리포트</h3>
                    <div className="grid md:grid-cols-3 gap-3">
                      {[
                        { tab: "overview" as const, icon: "🏆", label: "종합 GEO 진단", desc: "Authority Index™", ef: "geobh-geo-report" },
                        { tab: "analysis" as const, icon: "📋", label: "EEAT 진단", desc: "스코어카드 + 액션플랜", ef: "geobh-eeat-report" },
                        { tab: "citation" as const, icon: "🛡️", label: "Citation Moat™", desc: "AI 인용 신뢰도", ef: "geobh-moat-report" },
                        { tab: "som" as const, icon: "📊", label: "SoM 점유율", desc: "AI 검색 점유율", ef: "geobh-som-report" },
                        { tab: "compliance" as const, icon: "⚖️", label: "컴플라이언스", desc: "의료광고법 검증", ef: "geobh-compliance-report" },
                        { tab: "competitor" as const, icon: "🎯", label: "경쟁사 벤치마크", desc: "경쟁사 비교 분석", ef: "geobh-competitor-report" },
                      ].map((r) => (
                        <div key={r.ef} className="bg-white rounded-xl border p-4 flex items-center gap-3 group hover:shadow-md transition-all">
                          <span className="text-xl">{r.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900">{r.label}</p>
                            <p className="text-xs text-gray-400">{r.desc}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {r.tab !== "overview" && (
                              <button onClick={() => setActiveSection(r.tab)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                const res = await fetch(BAWEE_EF + "/" + r.ef + "?slug=" + client);
                                const text = await res.text();
                                const blob = new Blob([text], { type: "text/html;charset=utf-8" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = r.ef + "-" + client + ".html";
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              );
            })() : geoReportLoading ? (
              <div className="bg-white rounded-2xl border p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
              </div>
            ) : (
              /* Fallback: no geo report, show basic info */
              <section className="rounded-2xl p-8 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
                <h2 className="text-2xl font-bold mb-2">
                  {eeatData?.analysis?.url?.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "") || client}
                </h2>
                <p className="text-white/80">
                  {eeatData?.analysis?.industry ? eeatData.analysis.industry + " · " : ""}{hubConfig.brand_name} 담당 고객사
                </p>
                <p className="text-white/60 text-sm mt-2">종합 GEO 진단 데이터를 준비 중입니다.</p>
              </section>
            )}
          </div>
        )}

        {/* ──── ANALYSIS TAB ──── */}
        {activeSection === "analysis" && sc && (
          <div className="space-y-8">
            {/* AI Commentary — Top */}
            <AiCommentaryPanel tab="analysis" slug={client} brandName={hubConfig?.brand_name || client} industry={eeatData?.analysis?.industry || ""} color={color}
              data={{ overall_score: sc.overall_score, overall_grade: sc.overall_grade, experience: sc.experience.score, expertise: sc.expertise.score, authoritativeness: sc.authoritativeness.score, trustworthiness: sc.trustworthiness.score, strengths: eeatData?.analysis?.action_plan?.strengths, weaknesses: eeatData?.analysis?.action_plan?.weaknesses }} />
            {/* Scorecard */}
            <section className="bg-white rounded-2xl border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">E-E-A-T 스코어카드</h3>
                  <p className="text-sm text-gray-500">
                    {eeatData?.analysis.url?.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")} — {eeatData?.analysis.industry}
                  </p>
                </div>
                <GradeBadge grade={sc.overall_grade} score={sc.overall_score} />
              </div>
              <div className="space-y-4">
                <ScoreBar label="Experience" score={sc.experience.score} color="#f59e0b" />
                <ScoreBar label="Expertise" score={sc.expertise.score} color="#3b82f6" />
                <ScoreBar label="Authoritativeness" score={sc.authoritativeness.score} color="#8b5cf6" />
                <ScoreBar label="Trustworthiness" score={sc.trustworthiness.score} color="#10b981" />
              </div>
            </section>

            {/* Evidence & Gaps */}
            <section className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border p-5">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" /> 강점
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {[
                    ...sc.experience.evidence.slice(0, 2),
                    ...sc.expertise.evidence.slice(0, 2),
                    ...sc.authoritativeness.evidence.slice(0, 2),
                  ].map((e, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border p-5">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> 개선 필요
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {[
                    ...sc.experience.gaps,
                    ...sc.expertise.gaps,
                    ...sc.trustworthiness.gaps,
                  ].map((g, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Page Scores Table */}
            {eeatData?.page_scores && eeatData.page_scores.length > 0 && (
              <section className="bg-white rounded-2xl border overflow-hidden">
                <div className="p-5 border-b">
                  <h4 className="font-bold text-gray-900">페이지별 분석</h4>
                  <p className="text-sm text-gray-500">{eeatData.page_scores.length}개 페이지</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">페이지</th>
                        <th className="text-center px-3 py-3 font-medium text-gray-600 w-14">E</th>
                        <th className="text-center px-3 py-3 font-medium text-gray-600 w-14">Ex</th>
                        <th className="text-center px-3 py-3 font-medium text-gray-600 w-14">A</th>
                        <th className="text-center px-3 py-3 font-medium text-gray-600 w-14">T</th>
                        <th className="text-center px-3 py-3 font-medium text-gray-600 w-16">종합</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(showAllPages ? eeatData.page_scores : eeatData.page_scores.slice(0, 5)).map(
                        (page, i) => {
                          const shortUrl = page.url
                            .replace(/https?:\/\/(www\.)?samsunghospital\.com/, "")
                            .slice(0, 50);
                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={page.url}>
                                {shortUrl || "/"}
                              </td>
                              <td className="text-center px-3 py-3 text-gray-700">{page.experience}</td>
                              <td className="text-center px-3 py-3 text-gray-700">{page.expertise}</td>
                              <td className="text-center px-3 py-3 text-gray-700">{page.authoritativeness}</td>
                              <td className="text-center px-3 py-3 text-gray-700">{page.trustworthiness}</td>
                              <td className="text-center px-3 py-3">
                                <span
                                  className="inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold text-white"
                                  style={{
                                    backgroundColor: page.overall_score >= 85 ? "#10b981" : page.overall_score >= 80 ? "#3b82f6" : "#f59e0b",
                                  }}
                                >
                                  {page.overall_score}
                                </span>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
                {eeatData.page_scores.length > 5 && (
                  <button
                    onClick={() => setShowAllPages(!showAllPages)}
                    className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 border-t"
                  >
                    {showAllPages ? (
                      <>
                        접기 <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        전체 {eeatData.page_scores.length}개 보기 <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </section>
            )}

            {/* Compliance with Drilldown */}
            {eeatData?.compliance && (
              <section className="bg-white rounded-2xl border p-5">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" style={{ color }} /> 컴플라이언스 현황
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-red-50 rounded-xl">
                    <p className="text-2xl font-bold text-red-600">{eeatData.compliance.high_risk}</p>
                    <p className="text-xs text-red-600">High Risk</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <p className="text-2xl font-bold text-amber-600">{eeatData.compliance.medium_risk}</p>
                    <p className="text-xs text-amber-600">Medium Risk</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{eeatData.compliance.low_risk}</p>
                    <p className="text-xs text-green-600">Low Risk</p>
                  </div>
                </div>
                {eeatData.compliance.violations && eeatData.compliance.violations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {eeatData.compliance.violations.map((v: any, i: number) => (
                      <details key={i} className="group border rounded-lg overflow-hidden">
                        <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${
                            v.risk_level === "high" ? "bg-red-500" : v.risk_level === "medium" ? "bg-amber-500" : "bg-blue-500"
                          }`}>{v.risk_level === "high" ? "HIGH" : v.risk_level === "medium" ? "MED" : "LOW"}</span>
                          <span className="text-sm text-gray-800 flex-1 truncate">{v.text || v.before}</span>
                          <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="px-4 py-3 bg-gray-50 border-t text-sm space-y-2">
                          <div className="grid grid-cols-[80px_1fr] gap-y-2">
                            <span className="text-gray-500 font-medium">사유</span>
                            <span className="text-gray-700">{v.reason}</span>
                            <span className="text-gray-500 font-medium">위반 문구</span>
                            <span className="text-red-600">{v.text || v.before}</span>
                            <span className="text-gray-500 font-medium">수정안</span>
                            <span className="text-green-700">{v.after || "-"}</span>
                            <span className="text-gray-500 font-medium">조항</span>
                            <code className="text-gray-600 text-xs bg-gray-100 px-1.5 py-0.5 rounded w-fit">{v.violation_clause || "-"}</code>
                          </div>
                          {v.url && (
                            <p className="text-xs text-gray-400 truncate pt-1 border-t">
                              {v.url.replace(/https?:\/\/(www\.)?/, "")}
                            </p>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Action Plan */}
            {eeatData?.analysis?.action_plan && (
              <section className="bg-white rounded-2xl border p-5">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" /> 개선 액션플랜
                </h4>
                {(eeatData?.analysis?.action_plan?.strengths?.length ?? 0) > 0 && (
                  <div className="mb-4 p-3 bg-green-50 rounded-xl">
                    <p className="text-xs font-bold text-green-700 mb-1">강점</p>
                    <p className="text-sm text-green-800">{eeatData?.analysis?.action_plan?.strengths?.join(" · ")}</p>
                  </div>
                )}
                {(eeatData?.analysis?.action_plan?.weaknesses?.length ?? 0) > 0 && (
                  <div className="mb-4 p-3 bg-red-50 rounded-xl">
                    <p className="text-xs font-bold text-red-700 mb-1">약점</p>
                    <p className="text-sm text-red-800">{eeatData?.analysis?.action_plan?.weaknesses?.join(" · ")}</p>
                  </div>
                )}
                {eeatData?.analysis?.action_plan?.priority_actions?.map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 border rounded-lg mb-2 last:mb-0">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {a.priority || i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{a.action}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span>Effort: <span className={`font-bold ${a.effort === "low" ? "text-green-600" : a.effort === "medium" ? "text-amber-600" : "text-red-600"}`}>{a.effort}</span></span>
                        {a.eeat_impact && <span>Impact: <span className="font-bold text-blue-600">{a.eeat_impact}</span></span>}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* EEAT Full Report (inline) */}
            <EeatReportInline efUrl={BAWEE_EF} clientSlug={client} />
          </div>
        )}

        {/* ──── ANALYSIS TAB — Empty State ──── */}
        {activeSection === "analysis" && !sc && (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Shield className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">EEAT 분석이 아직 실행되지 않았습니다</h3>
            <p className="text-sm text-gray-400 mb-6">사이트를 크롤링하여 E-E-A-T(경험·전문·권위·신뢰) 점수를 산출합니다.<br />약 1~3분 소요됩니다.</p>
            {triggerResult?.type === "eeat" && (
              <div className={`mb-4 px-4 py-2 rounded-lg text-sm inline-block ${triggerResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{triggerResult.message}</div>
            )}
            <button onClick={triggerEEAT} disabled={triggerLoading === "eeat" || !analysisStatus?.brand?.site_domain}
              className="px-6 py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg disabled:opacity-50 inline-flex items-center gap-2"
              style={{ backgroundColor: color }}>
              {triggerLoading === "eeat" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              EEAT 분석 실행
            </button>
            {!analysisStatus?.brand?.site_domain && (
              <p className="text-xs text-gray-400 mt-3">브랜드 설정(site_domain)이 등록되지 않았습니다. 관리자에게 문의하세요.</p>
            )}
          </div>
        )}

        {/* ──── CITATION MOAT TAB ──── */}
        {activeSection === "citation" && (
          <div className="space-y-4">
            <AiCommentaryPanel tab="citation" slug={client} brandName={hubConfig?.brand_name || client} industry={eeatData?.analysis?.industry || ""} color={color}
              data={{ tab: "citation_moat", slug: client }} />
            {isAdmin && (
              <div className="flex justify-end">
                {triggerResult?.type === "citation" && (
                  <span className={`mr-3 text-sm px-3 py-1.5 rounded-lg ${triggerResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{triggerResult.message}</span>
                )}
                <button onClick={() => triggerReport("citation")} disabled={triggerLoading === "citation"}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  {triggerLoading === "citation" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  리포트 재생성
                </button>
              </div>
            )}
            <CitationMoatTab efUrl={BAWEE_EF} clientSlug={client} />
          </div>
        )}

        {/* ──── SOM TAB ──── */}
        {activeSection === "som" && (
          <div className="space-y-6">
            {/* AI Commentary — SoM Top */}
            {somData?.latest && (
              <AiCommentaryPanel tab="som" slug={client} brandName={hubConfig?.brand_name || client} industry={eeatData?.analysis?.industry || ""} color={color}
                data={{ overall_share: somData.latest.overall_share, avg_rank: somData.latest.avg_rank, top3_rate: somData.latest.top3_rate, llm_shares: somData.llm_shares }} />
            )}
            {somLoading && (
              <div className="bg-white rounded-2xl border p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              </div>
            )}
            {!somLoading && !somData && (
              <div className="bg-white rounded-2xl border p-12 text-center">
                <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">SoM 분석 데이터가 아직 없습니다</p>
                <p className="text-sm text-gray-400 mt-1">GEOcare.AI에서 SoM 분석을 실행하면 AI 검색 점유율 데이터가 여기에 표시됩니다.</p>
                <a href="https://geocare.ai" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: color }}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  GEOcare.AI에서 SoM 분석 실행
                </a>
              </div>
            )}
            {!somLoading && somData?.latest && (() => {
              const lt = somData.latest;
              const llm = somData.llm_shares || {};
              const trends = somData.trends || [];
              const llmEntries = Object.entries(llm).sort((a: any, b: any) => b[1] - a[1]);
              const maxLlm = Math.max(...Object.values(llm).map((v: any) => Number(v) || 0), 1);
              const llmColors: Record<string, string> = {
                "챗지피티": "#10a37f", "퍼플렉시티": "#6366f1", "제미나이": "#4285f4", "클로드": "#d97706"
              };
              return (
                <>
                  {/* Hero Stats */}
                  <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border p-5 text-center">
                      <p className="text-3xl font-black" style={{ color }}>{lt.overall_share}%</p>
                      <p className="text-xs text-gray-500 mt-1">AI 점유율</p>
                      {lt.share_change !== 0 && (
                        <p className={`text-xs mt-1 font-bold ${lt.share_change > 0 ? "text-green-600" : "text-red-500"}`}>
                          {lt.share_change > 0 ? "+" : ""}{lt.share_change}%p
                        </p>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl border p-5 text-center">
                      <p className="text-3xl font-black text-gray-900">{lt.avg_rank}</p>
                      <p className="text-xs text-gray-500 mt-1">평균 순위</p>
                    </div>
                    <div className="bg-white rounded-2xl border p-5 text-center">
                      <p className="text-3xl font-black text-blue-600">{lt.top3_rate}%</p>
                      <p className="text-xs text-gray-500 mt-1">Top3 비율</p>
                    </div>
                    <div className="bg-white rounded-2xl border p-5 text-center">
                      <p className="text-3xl font-black text-purple-600">{lt.first_mention_rate}%</p>
                      <p className="text-xs text-gray-500 mt-1">첫 번째 언급</p>
                    </div>
                  </section>

                  {/* LLM Breakdown */}
                  <section className="bg-white rounded-2xl border p-6">
                    <h4 className="font-bold text-gray-900 mb-1">AI 엔진별 점유율</h4>
                    <p className="text-sm text-gray-500 mb-5">{lt.total_queries}개 질의 · {lt.total_responses}개 응답 · {lt.analysis_date}</p>
                    <div className="space-y-4">
                      {llmEntries.map(([name, share]: [string, any]) => (
                        <div key={name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-gray-700">{name}</span>
                            <span className="text-sm font-bold" style={{ color: llmColors[name] || "#6b7280" }}>{share}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3">
                            <div
                              className="h-3 rounded-full transition-all duration-500"
                              style={{ width: `${(Number(share) / 100) * 100}%`, backgroundColor: llmColors[name] || "#6b7280" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Trends */}
                  {trends.length > 1 && (
                    <section className="bg-white rounded-2xl border p-6">
                      <h4 className="font-bold text-gray-900 mb-4">점유율 추이</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-3 font-medium text-gray-600">날짜</th>
                              <th className="text-center px-3 py-3 font-medium text-gray-600">점유율</th>
                              <th className="text-center px-3 py-3 font-medium text-gray-600">변동</th>
                              <th className="text-center px-3 py-3 font-medium text-gray-600">순위</th>
                              <th className="text-center px-3 py-3 font-medium text-gray-600">Top3</th>
                              <th className="text-center px-3 py-3 font-medium text-gray-600">질의</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {trends.map((t: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-700">{t.date}</td>
                                <td className="text-center px-3 py-3 font-bold" style={{ color }}>{t.share}%</td>
                                <td className={`text-center px-3 py-3 font-bold ${t.change > 0 ? "text-green-600" : t.change < 0 ? "text-red-500" : "text-gray-400"}`}>
                                  {t.change > 0 ? "+" : ""}{t.change}%p
                                </td>
                                <td className="text-center px-3 py-3 text-gray-700">{t.rank}</td>
                                <td className="text-center px-3 py-3 text-gray-700">{t.top3}%</td>
                                <td className="text-center px-3 py-3 text-gray-500">{t.queries}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  {/* Meta */}
                  <p className="text-xs text-gray-400 text-right">
                    데이터: GEOcare.AI SoM Engine · {somData.site_domain}
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {/* ──── COMPLIANCE TAB ──── */}
        {activeSection === "compliance" && (
          <div className="space-y-4">
            <AiCommentaryPanel tab="compliance" slug={client} brandName={hubConfig?.brand_name || client} industry={eeatData?.analysis?.industry || ""} color={color}
              data={{ tab: "compliance", slug: client, eeat_grade: sc?.overall_grade, trust_score: sc?.trustworthiness?.score }} />
            {!sc && isAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">EEAT 분석이 먼저 필요합니다</p>
                  <p className="text-xs text-amber-600">컴플라이언스 검증은 EEAT 분석 결과를 기반으로 수행됩니다.</p>
                </div>
                <button onClick={() => { setActiveSection("analysis"); }} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200">EEAT 탭으로 이동</button>
              </div>
            )}
            <ReportIframeTab
              efUrl={BAWEE_EF}
              clientSlug={client}
              efSlug="geobh-compliance-report"
              title="컴플라이언스 리포트"
              subtitle="의료광고법 등 규제 준수 현황을 자동으로 검증합니다."
              icon="⚖️"
              downloadName="compliance-report"
            />
          </div>
        )}

        {/* ──── COMPETITOR TAB ──── */}
        {activeSection === "competitor" && (
          <div className="space-y-4">
            <AiCommentaryPanel tab="competitor" slug={client} brandName={hubConfig?.brand_name || client} industry={eeatData?.analysis?.industry || ""} color={color}
              data={{ tab: "competitor", slug: client }} />
            {isAdmin && (
              <div className="flex justify-end">
                {triggerResult?.type === "competitor" && (
                  <span className={`mr-3 text-sm px-3 py-1.5 rounded-lg ${triggerResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{triggerResult.message}</span>
                )}
                <button onClick={() => triggerReport("competitor")} disabled={triggerLoading === "competitor"}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  {triggerLoading === "competitor" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  리포트 재생성
                </button>
              </div>
            )}
            <ReportIframeTab
              efUrl={BAWEE_EF}
              clientSlug={client}
              efSlug="geobh-competitor-report"
              title="경쟁사 벤치마크 리포트"
              subtitle="AI 검색엔진 기준 경쟁사 대비 점유율과 언급 현황을 비교합니다."
              icon="🎯"
              downloadName="competitor-report"
            />
          </div>
        )}

        {/* ──── CONTENT LAB TAB ──── */}
        {activeSection === "contentlab" && (() => {
          const CL_TYPES = [
            { key: "blog", label: "블로그/홈페이지", icon: "📝", desc: "EEAT 기반 SEO 콘텐츠", rec: "claude" },
            { key: "faq", label: "FAQ + Schema", icon: "❓", desc: "구조화 FAQ + JSON-LD", rec: "claude" },
            { key: "youtube", label: "YouTube 대본", icon: "🎬", desc: "영상 스크립트", rec: "gpt" },
            { key: "ad", label: "광고 배너 카피", icon: "📢", desc: "헤드라인 + CTA 3종", rec: "gpt" },
            { key: "community", label: "커뮤니티/SNS", icon: "💬", desc: "네이버/인스타/브런치", rec: "gemini" },
            { key: "social", label: "소셜 트렌드", icon: "🐦", desc: "X 감성 분석 + 여론", rec: "grok" },
            { key: "jsonld", label: "JSON-LD 구조화", icon: "🔗", desc: "Schema.org 코드", rec: "claude" },
          ];
          const CL_LLMS = [
            { key: "claude", name: "Claude", clr: "#d97706", str: "장문 · 구조화 · 한국어" },
            { key: "gpt", name: "GPT-4o", clr: "#10a37f", str: "대화체 · 스크립트 · 카피" },
            { key: "gemini", name: "Gemini 2.5", clr: "#4285f4", str: "트렌드 · 캐주얼 · 빠른 생성" },
            { key: "grok", name: "Grok", clr: "#000000", str: "소셜 감성 · X 트렌드 · 실시간" },
          ];
          const efBase = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";
          const doGen = async (llmKey?: string) => {
            const t = clSelectedType; const l = llmKey || clSelectedLlm;
            if (!t || !l || !client) return;
            setClGenLoading(true); setClGenResult(null);
            try {
              const r = await fetch(efBase + "/geobh-content-gen", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug: client, content_type: t, llm: l }),
              });
              const d = await r.json();
              setClGenResult(d);
              if (d.success) setClHistory(prev => [...prev, d]);
            } catch {}
            setClGenLoading(false);
          };
          return (
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Wand2 className="w-5 h-5" style={{ color }} /> 콘텐츠 랩
                </h3>
                <p className="text-sm text-gray-500 mt-1">EEAT 분석 결과를 기반으로 AI가 콘텐츠를 생성합니다. 4개 LLM 비교 가능</p>
              </div>

              {/* Content Type Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {CL_TYPES.map(ct => {
                  const sel = clSelectedType === ct.key;
                  const recLlm = CL_LLMS.find(l => l.key === ct.rec);
                  return (
                    <button key={ct.key}
                      onClick={() => { setClSelectedType(ct.key); setClSelectedLlm(ct.rec); setClGenResult(null); }}
                      className={`p-3 rounded-xl border text-left transition-all ${sel ? "ring-2 shadow-sm bg-white" : "bg-white hover:border-gray-300"}`}
                      style={sel ? { borderColor: color } : {}}>
                      <div className="flex items-start justify-between">
                        <span className="text-xl">{ct.icon}</span>
                        {recLlm && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: recLlm.clr }}>{recLlm.name}</span>}
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-1.5">{ct.label}</p>
                      <p className="text-xs text-gray-500">{ct.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* LLM Selection + Generate */}
              {clSelectedType && (
                <div className="space-y-3">
                  <div className="flex gap-2 items-center flex-wrap">
                    {CL_LLMS.map(llm => {
                      const isRec = CL_TYPES.find(c => c.key === clSelectedType)?.rec === llm.key;
                      const sel = clSelectedLlm === llm.key;
                      return (
                        <button key={llm.key}
                          onClick={() => { setClSelectedLlm(llm.key); setClGenResult(null); }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${sel ? "border-2 shadow-sm" : "bg-white hover:border-gray-300"}`}
                          style={sel ? { borderColor: llm.clr, backgroundColor: llm.clr + "08" } : {}}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: llm.clr }} />
                          <span className="font-bold text-gray-900">{llm.name}</span>
                          {isRec && <span className="text-[10px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">추천</span>}
                        </button>
                      );
                    })}
                    <button onClick={() => doGen()} disabled={clGenLoading || !clSelectedLlm}
                      className="ml-auto px-5 py-2 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
                      style={{ backgroundColor: CL_LLMS.find(l => l.key === clSelectedLlm)?.clr || color }}>
                      {clGenLoading ? "생성 중..." : "🚀 생성"}
                    </button>
                  </div>
                  {clSelectedLlm && (
                    <p className="text-xs text-gray-400">{CL_LLMS.find(l => l.key === clSelectedLlm)?.name} — {CL_LLMS.find(l => l.key === clSelectedLlm)?.str}</p>
                  )}
                </div>
              )}

              {/* Loading */}
              {clGenLoading && (
                <div className="bg-white rounded-xl border p-8 flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color }} />
                  <span className="text-sm text-gray-500">{CL_LLMS.find(l => l.key === clSelectedLlm)?.name}이 콘텐츠를 생성하고 있습니다... (10~30초)</span>
                </div>
              )}

              {/* Result */}
              {clGenResult?.success && (
                <div className="space-y-3">
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CL_LLMS.find(l => l.key === clGenResult.llm)?.clr }} />
                        <span className="text-sm font-bold">{clGenResult.llm_label || clGenResult.llm_model}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-sm text-gray-600">{clGenResult.content_label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{(clGenResult.elapsed_ms / 1000).toFixed(1)}s</span>
                        <span>{clGenResult.content?.length?.toLocaleString()}자</span>
                        <button onClick={() => navigator.clipboard.writeText(clGenResult.content)}
                          className="px-2 py-1 rounded border hover:bg-gray-100 text-gray-600">복사</button>
                      </div>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto">
                      <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">{clGenResult.content}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">다른 AI 비교:</span>
                    {CL_LLMS.filter(l => l.key !== clGenResult.llm).map(llm => (
                      <button key={llm.key} onClick={() => { setClSelectedLlm(llm.key); setTimeout(() => doGen(llm.key), 50); }}
                        disabled={clGenLoading} className="text-xs px-3 py-1.5 rounded-lg border hover:shadow-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: llm.clr }} />{llm.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {clGenResult && !clGenResult.success && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                  <p className="text-sm text-red-700">오류: {clGenResult.error}</p>
                </div>
              )}

              {/* History */}
              {clHistory.length > 1 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">📊 생성 비교 ({clHistory.length}건)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm bg-white rounded-xl border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">AI</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">유형</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-600">시간</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-600">글자수</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-600"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {clHistory.map((h, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CL_LLMS.find(l => l.key === h.llm)?.clr }} />
                              <span className="font-medium">{h.llm_label || h.llm_model}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-600">{h.content_label}</td>
                            <td className="px-3 py-2 text-center">{(h.elapsed_ms / 1000).toFixed(1)}s</td>
                            <td className="px-3 py-2 text-center">{h.content?.length?.toLocaleString()}</td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => setClGenResult(h)} className="text-xs text-blue-600 hover:underline">보기</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ──── KHub AI 추천 가이드 + 파트너 메모 ──── */}
        {["overview", "analysis", "citation", "som", "compliance", "competitor"].includes(activeSection) && (
          <div className="mt-8 space-y-4">
            {/* KHub Recommendations */}
            <section className="bg-white rounded-2xl border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  <h3 className="font-bold text-gray-900">AI 추천 가이드</h3>
                  {khubRecs?.section && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {khubRecs.section === "all" ? "종합" : khubRecs.section.toUpperCase()}
                    </span>
                  )}
                </div>
                {khubRecs?.diagnosis?.grade && (
                  <span className="text-xs text-gray-500">
                    등급 {khubRecs.diagnosis.grade} · {khubRecs.diagnosis.overall_score ?? "—"}점
                  </span>
                )}
              </div>
              <div className="p-6">
                {khubRecsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                    <span className="ml-2 text-sm text-gray-400">가이드 검색 중...</span>
                  </div>
                ) : khubRecs?.recommendations?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {khubRecs.recommendations.map((rec: any, i: number) => (
                      <div key={rec.id || i} className="p-4 rounded-xl border hover:shadow-md transition-all group cursor-pointer bg-gray-50/50">
                        <div className="flex items-start gap-3">
                          <span className="text-sm mt-0.5">
                            {rec.project_code === "BH_COMMON" ? "📘" : rec.project_code === "GEO_COMMERCE" ? "🏪" : "📄"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {rec.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rec.content_snippet}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{rec.project_code}</span>
                              <span className="text-[10px] text-gray-400">{rec.relevance_reason}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">이 섹션에 대한 추천 가이드가 없습니다.</p>
                )}
              </div>
            </section>

            {/* Partner Memo */}
            <section className="bg-white rounded-2xl border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-2">
                <span className="text-lg">📝</span>
                <h3 className="font-bold text-gray-900">파트너 메모</h3>
                <span className="text-xs text-gray-400 ml-auto">이 고객에 대한 메모를 남기면 KHub에 자동 저장됩니다</span>
              </div>
              <div className="p-6">
                <textarea
                  className="w-full border rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  rows={3}
                  placeholder="파트너 메모를 입력하세요... (예: 이 고객사는 PR 우선 진행, 3월 런칭 예정)"
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-400">
                    {memoSaved && <span className="text-green-600 font-medium">✅ KHub에 저장 완료!</span>}
                  </div>
                  <button
                    onClick={handleMemoSave}
                    disabled={!memoText.trim() || memoSaving}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
                    style={{ backgroundColor: color }}
                  >
                    {memoSaving ? "저장 중..." : "메모 저장"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ──── SERVICES TAB ──── */}
        {activeSection === "services" && (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-2">E-E-A-T Authority Package</h3>
              <p className="text-gray-600 mb-6">
                PR 실행과 기술적 E-E-A-T 최적화를 결합한 통합 서비스 패키지
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <PackageCard
                  tier="Bronze"
                  name="모니터링"
                  price="월 200만원~"
                  color={color}
                  features={[
                    "월간 미디어 멘션 트래킹",
                    "E-E-A-T 기본 점수 진단",
                    "컴플라이언스 리포트",
                    "AI 가시성 기본 보고",
                  ]}
                />
                <PackageCard
                  tier="Silver"
                  name="성장"
                  price="월 500만원~"
                  color={color}
                  highlight
                  features={[
                    "Bronze 전체 포함",
                    "월 2건 기고/인터뷰 배치",
                    "Schema Markup 자동 생성",
                    "AI 가시성 월간 상세 보고",
                    "JSON-LD 최적화",
                  ]}
                />
                <PackageCard
                  tier="Gold"
                  name="리더십"
                  price="월 1,000만원~"
                  color={color}
                  features={[
                    "Silver 전체 포함",
                    "Thought Leadership 풀 프로그램",
                    "AI 인용 최적화 콘텐츠 제작",
                    "위기 커뮤니케이션 연동",
                    "분기별 전략 리뷰",
                  ]}
                />
              </div>
            </section>

            <section className="bg-white rounded-2xl border p-6">
              <h4 className="font-bold text-gray-900 mb-4">서비스 영역</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    title: "PR / Earned Media",
                    desc: "언론 보도, 기고, 인터뷰 → AI 검색 인용 소스 확보",
                  },
                  {
                    title: "E-E-A-T 최적화",
                    desc: "Schema.org 마크업, JSON-LD, 전문가 프로필 구조화",
                  },
                  {
                    title: "의료광고법 컴플라이언스",
                    desc: "14개 금지항목 자동 스크리닝, 수정 권고안 제공",
                  },
                  {
                    title: "AI 가시성 모니터링",
                    desc: "ChatGPT, Perplexity, 네이버 큐: 에서 브랜드 언급 추적",
                  },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <h5 className="font-bold text-gray-900">{item.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ──── CHAT TAB ──── */}
        {activeSection === "chat" && (
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
            <div className="flex flex-col h-full">
              {/* Chat messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div
                      className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Bot className="w-8 h-8" style={{ color }} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{hubConfig.brand_name} AI 어시스턴트</h2>
                    <p className="text-gray-600 mb-8">궁금한 점을 물어보세요!</p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                      {suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleChat(q)}
                          className="px-4 py-2 bg-gray-50 border rounded-full text-sm hover:border-gray-400 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                            msg.role === "user" ? "bg-blue-600 text-white" : "bg-white border shadow-sm"
                          }`}
                          style={msg.role === "user" ? { backgroundColor: color } : {}}
                        >
                          {msg.isLoading ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">답변 생성 중...</span>
                            </div>
                          ) : (
                            <>
                              <div
                                className={`prose prose-sm max-w-none ${
                                  msg.role === "user" ? "prose-invert" : ""
                                }`}
                              >
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                              {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs text-gray-400 mb-1">참고 문서</p>
                                  <div className="flex flex-wrap gap-1">
                                    {msg.sources.map((s, si) => (
                                      <span
                                        key={si}
                                        className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                      >
                                        <FileText className="w-3 h-3" />
                                        {s.title}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Chat input */}
              <div className="border-t px-4 py-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleChat(input);
                  }}
                  className="flex gap-3 max-w-3xl mx-auto"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`${hubConfig.brand_name}에 대해 궁금한 점을 물어보세요`}
                    className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || chatLoading}
                    className="px-4 py-3 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ backgroundColor: color }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
                <p className="text-xs text-gray-400 text-center mt-2">
                  AI가 생성한 답변입니다. 정확한 정보는 담당자에게 문의하세요.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
