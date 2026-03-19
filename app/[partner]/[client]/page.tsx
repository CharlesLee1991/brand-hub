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
import { createClient } from "@/lib/supabase-browser";

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
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const res = await fetch(`${efUrl}/geobh-report-with-commentary?ef=geobh-eeat-report&slug=${clientSlug}`);
                const text = await res.text();
                const blob = new Blob([text.includes("</body>") ? text : html], { type: "text/html;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `eeat-report-${clientSlug}.html`; a.click();
                URL.revokeObjectURL(url);
              } catch {
                const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `eeat-report-${clientSlug}.html`; a.click();
                URL.revokeObjectURL(url);
              }
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
          onClick={async () => {
            try {
              const res = await fetch(`${efUrl}/geobh-report-with-commentary?ef=geobh-moat-report&slug=${clientSlug}`);
              const text = await res.text();
              const blob = new Blob([text.includes("</body>") ? text : (html || "")], { type: "text/html;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `citation-moat-${clientSlug}.html`; a.click();
              URL.revokeObjectURL(url);
            } catch {
              if (!html) return;
              const blob = new Blob([html], { type: "text/html;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `citation-moat-${clientSlug}.html`; a.click();
              URL.revokeObjectURL(url);
            }
          }}
          disabled={!html}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5 disabled:opacity-40"
        >
          <FileText className="w-3.5 h-3.5" />
          다운로드 (AI 의견 포함)
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
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(efUrl + "/" + efSlug + "?slug=" + clientSlug)
      .then((res) => res.text())
      .then((text) => { setHtml(text); setLoading(false); })
      .catch(() => setLoading(false));
  }, [efUrl, clientSlug, efSlug]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Fetch report with AI commentary injected
      const res = await fetch(`${efUrl}/geobh-report-with-commentary?ef=${efSlug}&slug=${clientSlug}`);
      const text = await res.text();
      const blob = new Blob([text], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName + "-" + clientSlug + ".html";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to original HTML
      if (html) {
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadName + "-" + clientSlug + ".html";
        a.click();
        URL.revokeObjectURL(url);
      }
    }
    setDownloading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{icon} {title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={!html || downloading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5 disabled:opacity-40"
        >
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          {downloading ? "준비 중..." : "다운로드 (AI 의견 포함)"}
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeLlm, setActiveLlm] = useState<"claude" | "gpt">("claude");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";

  const llms = [
    { key: "claude" as const, name: "Claude", sub: "Anthropic", clr: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    { key: "gpt" as const, name: "GPT-4o", sub: "OpenAI", clr: "#10a37f", bg: "#ecfdf5", border: "#a7f3d0" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BAWEE_EF}/geobh-ai-commentary?slug=${slug}&tab=${tab}`);
        const d = await res.json();
        if (d.success && d.cached && d.commentary) {
          setCommentary(d.commentary); setCreatedAt(d.created_at); setCached(true);
        }
      } catch {}
      setInitialLoading(false);
    })();
  }, [slug, tab]);

  const generate = async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${BAWEE_EF}/geobh-ai-commentary`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab, slug, data, brand_name: brandName, industry, force }),
      });
      const d = await res.json();
      if (d.success) { setCommentary(d.commentary); setCreatedAt(d.created_at); setCached(d.cached || false); }
    } catch {}
    setLoading(false);
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  if (initialLoading) return null;

  if (!commentary) {
    return (
      <button onClick={() => generate()} disabled={loading}
        className="w-full rounded-xl p-3 text-center transition-all flex items-center gap-2.5 group border border-dashed hover:border-solid"
        style={{ borderColor: loading ? "#d1d5db" : color + "40", background: `linear-gradient(135deg, ${color}04, ${color}02)` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "10" }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" style={{ color }} /> : <Bot className="w-4 h-4" style={{ color }} />}
        </div>
        <div className="text-left">
          <p className="font-semibold text-xs text-gray-700">{loading ? "AI 분석 중..." : "AI 진단 의견 생성"}</p>
          <p className="text-[10px] text-gray-400">Claude · GPT-4o 비교</p>
        </div>
      </button>
    );
  }

  const active = llms.find(l => l.key === activeLlm)!;

  return (
    <section className="rounded-xl overflow-hidden border" style={{ borderColor: active.border }}>
      {/* Header — compact */}
      <div className="px-3.5 py-2 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${active.bg}, white)` }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: active.clr }}>
            <Bot className="w-3 h-3 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-gray-900 text-xs">AI 진단</h3>
            <span className="text-[9px] px-1 py-0.5 rounded-full font-medium" style={{ backgroundColor: active.clr + "15", color: active.clr }}>
              {active.name}
            </span>
            {createdAt && <span className="text-[9px] text-gray-400 hidden sm:inline">{fmtDate(createdAt)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex rounded-lg overflow-hidden border bg-white text-[10px]">
            {llms.map(l => (
              <button key={l.key} onClick={() => setActiveLlm(l.key)}
                className="px-2 py-1 font-semibold transition-all"
                style={activeLlm === l.key ? { backgroundColor: l.clr, color: "white" } : { color: "#9ca3af" }}>
                {l.name}
              </button>
            ))}
          </div>
          <button onClick={() => generate(true)} disabled={loading} title="재생성"
            className="p-1 rounded hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-colors">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Content — compact scrollable, ~1/3 viewport */}
      <div className="bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: active.clr }} />
            <span className="text-xs text-gray-400">{active.name} 분석 중...</span>
          </div>
        ) : (
          <div className="max-h-[220px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: `${active.clr}30 transparent` }}>
            <div className="px-3.5 py-2.5 max-w-none text-gray-600 leading-relaxed text-[11.5px]
              [&_h1]:text-xs [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-3 [&_h1]:mb-1
              [&_h2]:text-[11.5px] [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-2.5 [&_h2]:mb-1
              [&_h3]:text-[11px] [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-2 [&_h3]:mb-0.5
              [&_h4]:text-[11px] [&_h4]:font-semibold [&_h4]:text-gray-800 [&_h4]:mt-1.5 [&_h4]:mb-0.5
              [&_p]:text-[11.5px] [&_p]:my-1 [&_p]:leading-relaxed
              [&_li]:text-[11px] [&_li]:leading-relaxed [&_li]:text-gray-600
              [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4
              [&_strong]:text-gray-900">
              <ReactMarkdown>{commentary[activeLlm] || "의견 없음"}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ────── Content Export/Copy Actions (Phase 3.5) ────── */

function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>").replace(/$/, "</p>")
    .replace(/<p><h/g, "<h").replace(/<\/h(\d)><\/p>/g, "</h$1>")
    .replace(/<p><ul>/g, "<ul>").replace(/<\/ul><\/p>/g, "</ul>");
}

function downloadAsDoc(content: string, title: string) {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><style>body{font-family:'Malgun Gothic',sans-serif;font-size:11pt;line-height:1.6;max-width:700px;margin:0 auto;padding:40px}h1{font-size:18pt;margin-bottom:12px}h2{font-size:14pt;margin-top:20px;margin-bottom:8px;color:#333}h3{font-size:12pt;margin-top:16px}ul{margin:8px 0}li{margin:4px 0}pre{background:#f5f5f5;padding:12px;border-radius:6px;font-size:9pt;overflow-x:auto}blockquote{border-left:3px solid #ddd;padding-left:12px;color:#666}</style></head>
<body>${mdToHtml(content)}</body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `${title.replace(/[^가-힣a-zA-Z0-9\s-]/g, "").slice(0, 50)}.doc`;
  a.click(); URL.revokeObjectURL(a.href);
}

function copyAsHtml(content: string) {
  const html = mdToHtml(content);
  const blob = new Blob([html], { type: "text/html" });
  navigator.clipboard.write([new ClipboardItem({ "text/html": blob, "text/plain": new Blob([content], { type: "text/plain" }) })]);
}

function formatForYoutubeDesc(content: string): string {
  // Remove timecodes, clean up stage directions, add hashtags
  let text = content
    .replace(/\[([^\]]*?)[\s]*\d+:\d+[~\-–—]\d+:\d+\]/g, "▶ $1")
    .replace(/\(([^)]+)\)/g, "")  // remove stage directions
    .replace(/^#+ /gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // Extract potential keywords from content
  const tags = content.match(/(?:브랜드|패션|디자인|뷰티|리뷰|추천|비교|언박싱|하울)/g);
  if (tags) text += "\n\n" + Array.from(new Set(tags)).map(t => `#${t}`).join(" ");
  return text;
}

function formatForInstaCaption(content: string): string {
  // Extract slide texts, flatten, add hashtags
  let text = content
    .replace(/###\s*\d+장[:\s]*/gi, "")
    .replace(/^#+ /gm, "")
    .replace(/\*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const hashtagMatch = content.match(/(#[^\s#]+[\s]*){2,}/);
  if (hashtagMatch) text += "\n\n" + hashtagMatch[0].trim();
  else text += "\n\n#브랜드 #마케팅";
  return text;
}

function formatForNaverBlog(content: string): string {
  // Naver blog editor compatible — inline styles, no classes
  const html = mdToHtml(content);
  return html
    .replace(/<h1>/g, '<h1 style="font-size:24px;font-weight:bold;margin:20px 0 12px;color:#333">')
    .replace(/<h2>/g, '<h2 style="font-size:20px;font-weight:bold;margin:18px 0 10px;color:#444">')
    .replace(/<h3>/g, '<h3 style="font-size:17px;font-weight:bold;margin:14px 0 8px;color:#555">')
    .replace(/<p>/g, '<p style="font-size:15px;line-height:1.8;margin:8px 0;color:#333">')
    .replace(/<strong>/g, '<strong style="font-weight:bold;color:#222">')
    .replace(/<ul>/g, '<ul style="margin:10px 0;padding-left:24px">')
    .replace(/<li>/g, '<li style="font-size:15px;line-height:1.7;margin:4px 0">');
}

function formatForTistoryHtml(content: string): string {
  // Tistory editor compatible — similar to Naver but with data attributes
  const html = mdToHtml(content);
  return html
    .replace(/<h1>/g, '<h1 style="font-size:24px;font-weight:700;margin:24px 0 12px;color:#1a1a1a">')
    .replace(/<h2>/g, '<h2 style="font-size:20px;font-weight:700;margin:20px 0 10px;color:#2a2a2a">')
    .replace(/<h3>/g, '<h3 style="font-size:17px;font-weight:600;margin:16px 0 8px;color:#3a3a3a">')
    .replace(/<p>/g, '<p style="font-size:16px;line-height:1.8;margin:10px 0;color:#333">')
    .replace(/<ul>/g, '<ul style="margin:12px 0;padding-left:28px">')
    .replace(/<li>/g, '<li style="font-size:16px;line-height:1.7;margin:5px 0">');
}

function formatForWordPressHtml(content: string): string {
  // WordPress Gutenberg compatible — wp:paragraph blocks
  const html = mdToHtml(content);
  return html
    .replace(/<h2>(.*?)<\/h2>/g, '<!-- wp:heading {"level":2} -->\n<h2 class="wp-block-heading">$1</h2>\n<!-- /wp:heading -->')
    .replace(/<h3>(.*?)<\/h3>/g, '<!-- wp:heading {"level":3} -->\n<h3 class="wp-block-heading">$1</h3>\n<!-- /wp:heading -->')
    .replace(/<p>(.*?)<\/p>/g, '<!-- wp:paragraph -->\n<p>$1</p>\n<!-- /wp:paragraph -->')
    .replace(/<ul>([\s\S]*?)<\/ul>/g, '<!-- wp:list -->\n<ul class="wp-block-list">$1</ul>\n<!-- /wp:list -->');
}

function copyRichHtml(html: string, key: string, flash: (k: string) => void) {
  const blob = new Blob([html], { type: "text/html" });
  const plainBlob = new Blob([html.replace(/<[^>]*>/g, "")], { type: "text/plain" });
  navigator.clipboard.write([new ClipboardItem({ "text/html": blob, "text/plain": plainBlob })]);
  flash(key);
}

function formatAdCopySheet(content: string): string {
  const blocks = content.split(/##\s*배너\s*\d+[:\s]*/i).filter(s => s.trim());
  let sheet = "=== 광고 배너 카피 시트 ===\n\n";
  blocks.forEach((block, i) => {
    const hl = block.match(/헤드라인[:\s]+(.+)/)?.[1]?.trim() || "";
    const sc = block.match(/서브카피[:\s]+(.+)/)?.[1]?.trim() || "";
    const cta = block.match(/CTA[^:\n]*[:\s]+(.+)/)?.[1]?.trim() || "";
    const kw = block.match(/(?:타겟|키워드)[^:\n]*[:\s]+(.+)/)?.[1]?.trim() || "";
    if (hl) {
      sheet += `[배너 ${i + 1}]\n헤드라인: ${hl}\n서브카피: ${sc}\nCTA: ${cta}\n키워드: ${kw}\n\n`;
    }
  });
  return sheet.trim();
}

function ContentActionBar({ content, contentType, title, color, wpConnection, onWpPublish, wpPublishing }: {
  content: string; contentType: string; title: string; color: string;
  wpConnection?: any; onWpPublish?: () => void; wpPublishing?: boolean;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const flash = (key: string) => { setCopied(key); setTimeout(() => setCopied(null), 1500); };
  const copyText = (text: string, key: string) => { navigator.clipboard.writeText(text); flash(key); };
  const copyHtml = (text: string, key: string) => { copyAsHtml(text); flash(key); };

  const channelButtons: { key: string; label: string; icon: string; action: () => void }[] = [];

  switch (contentType) {
    case "youtube":
      channelButtons.push(
        { key: "yt-desc", label: "YouTube 설명란", icon: "▶", action: () => copyText(formatForYoutubeDesc(content), "yt-desc") },
        { key: "yt-raw", label: "대본 전체", icon: "📝", action: () => copyText(content.replace(/^#+ /gm, ""), "yt-raw") },
      );
      break;
    case "faq":
      channelButtons.push(
        { key: "faq-text", label: "Q&A 텍스트만", icon: "💬", action: () => copyText(content.replace(/```json[\s\S]*?```/g, "").trim(), "faq-text") },
      );
      break;
    case "ad":
      channelButtons.push(
        { key: "ad-sheet", label: "카피 시트", icon: "📊", action: () => copyText(formatAdCopySheet(content), "ad-sheet") },
        { key: "ad-hl", label: "헤드라인만", icon: "✏️", action: () => {
          const hls = Array.from(content.matchAll(/헤드라인[:\s]+(.+)/g)).map(m => m[1].trim());
          copyText(hls.join("\n"), "ad-hl");
        }},
      );
      break;
    case "community":
      channelButtons.push(
        { key: "insta", label: "인스타 캡션", icon: "📸", action: () => copyText(formatForInstaCaption(content), "insta") },
      );
      break;
    case "social":
      channelButtons.push(
        { key: "x-thread", label: "X 쓰레드", icon: "🐦", action: () => copyText(content.replace(/^#+ /gm, "").replace(/\*\*/g, ""), "x-thread") },
      );
      break;
    case "jsonld":
      channelButtons.push(
        { key: "jsonld-script", label: "script 태그", icon: "🔗", action: () => {
          const codes = Array.from(content.matchAll(/```json\n([\s\S]+?)\n```/g)).map(m => m[1].trim());
          const scripts = codes.map(c => `<script type="application/ld+json">\n${c}\n</script>`).join("\n\n");
          copyText(scripts, "jsonld-script");
        }},
        { key: "jsonld-raw", label: "JSON만", icon: "{ }", action: () => {
          const codes = Array.from(content.matchAll(/```json\n([\s\S]+?)\n```/g)).map(m => m[1].trim());
          copyText(codes.join("\n\n"), "jsonld-raw");
        }},
      );
      break;
    default: // blog
      channelButtons.push(
        { key: "blog-html", label: "HTML (서식)", icon: "🌐", action: () => copyHtml(content, "blog-html") },
      );
  }

  // Cross-channel rich HTML copy buttons (all text-based types)
  if (contentType !== "jsonld") {
    channelButtons.push(
      { key: "ch-naver", label: "네이버용", icon: "📗", action: () => copyRichHtml(formatForNaverBlog(content), "ch-naver", flash) },
      { key: "ch-tistory", label: "티스토리용", icon: "📘", action: () => copyRichHtml(formatForTistoryHtml(content), "ch-tistory", flash) },
      { key: "ch-wp", label: "WordPress용", icon: "🔵", action: () => { navigator.clipboard.writeText(formatForWordPressHtml(content)); flash("ch-wp"); } },
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-4 py-2.5 border-t bg-gray-50/50 text-xs">
      <span className="text-gray-400 mr-1">내보내기:</span>
      {channelButtons.map(btn => (
        <button key={btn.key} onClick={btn.action}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${copied === btn.key ? "bg-green-50 border-green-300 text-green-700" : "hover:bg-white hover:shadow-sm text-gray-600 border-gray-200"}`}>
          <span>{btn.icon}</span>
          <span>{copied === btn.key ? "✓ 복사됨" : btn.label}</span>
        </button>
      ))}
      <span className="text-gray-300 mx-0.5">|</span>
      <button onClick={() => downloadAsDoc(content, title)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-white hover:shadow-sm text-gray-600">
        <span>📄</span><span>DOCX 다운</span>
      </button>
      <button onClick={() => copyText(content, "raw")}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${copied === "raw" ? "bg-green-50 border-green-300 text-green-700" : "hover:bg-white hover:shadow-sm text-gray-600 border-gray-200"}`}>
        <span>📋</span><span>{copied === "raw" ? "✓ 복사됨" : "원본 복사"}</span>
      </button>
      {wpConnection && onWpPublish && (
        <>
          <span className="text-gray-300 mx-0.5">|</span>
          <button onClick={onWpPublish} disabled={wpPublishing}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all font-medium ${wpPublishing ? "bg-blue-50 border-blue-200 text-blue-400 cursor-wait" : "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:shadow-sm"}`}>
            <span>{wpPublishing ? "⏳" : "🌐"}</span>
            <span>{wpPublishing ? "발행 중..." : "WordPress 발행"}</span>
          </button>
        </>
      )}
    </div>
  );
}

/* ────── Content Preview Components (Phase 3) ────── */

function YouTubePreview({ content, color }: { content: string; color: string }) {
  const sectionColors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
  const sections: { name: string; start: string; end: string; body: string; durationSec: number }[] = [];
  const regex = /\[([^\]]*?)[\s]*(\d+:\d+)[~\-–—](\d+:\d+)\]/g;
  const parts = content.split(regex);
  // parts: [before, name, start, end, body, name, start, end, body, ...]
  for (let i = 1; i + 3 < parts.length; i += 4) {
    const name = parts[i].trim();
    const start = parts[i + 1];
    const end = parts[i + 2];
    const body = (parts[i + 3] || "").trim();
    const toSec = (t: string) => { const p = t.split(":").map(Number); return (p[0] || 0) * 60 + (p[1] || 0); };
    sections.push({ name, start, end, body, durationSec: Math.max(toSec(end) - toSec(start), 1) });
  }
  if (sections.length === 0) return <div className="prose prose-sm max-w-none text-gray-800 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_p]:text-[13px] [&_li]:text-[13px] [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[11px]"><ReactMarkdown>{content}</ReactMarkdown></div>;
  const totalSec = sections.reduce((s, x) => s + x.durationSec, 0);
  const fmtDur = (s: number) => s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-red-500 text-lg">▶</span>
        <span className="font-bold">YouTube 대본 미리보기</span>
        <span className="text-xs text-gray-400 ml-auto">총 {Math.floor(totalSec / 60)}:{String(totalSec % 60).padStart(2, "0")} | {sections.length}개 섹션</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full flex overflow-hidden">
        {sections.map((s, i) => (
          <div key={i} className="h-full" style={{ width: `${(s.durationSec / totalSec) * 100}%`, backgroundColor: sectionColors[i % sectionColors.length] }} />
        ))}
      </div>
      {sections.map((s, i) => (
        <div key={i} className="border rounded-xl p-4 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100">{s.start}</span>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sectionColors[i % sectionColors.length] }} />
            <span className="text-sm font-bold">{s.name}</span>
            <span className="text-xs text-gray-400 ml-auto">{fmtDur(s.durationSec)}</span>
          </div>
          <div className="text-[12.5px] text-gray-600 leading-relaxed whitespace-pre-wrap">{s.body.slice(0, 500)}{s.body.length > 500 ? "…" : ""}</div>
        </div>
      ))}
      <div className="text-xs text-gray-400 text-center">📊 총 {fmtDur(totalSec)} | {sections.length}개 섹션 | {content.length.toLocaleString()}자</div>
    </div>
  );
}

function FaqPreview({ content, color }: { content: string; color: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqRegex = /##\s*Q\d*[:\s]*(.+?)[\n\r]+(?:A[:\s]*)([\s\S]+?)(?=##\s*Q|\n```|\n---|$)/gi;
  const faqs: { q: string; a: string }[] = [];
  let m; while ((m = faqRegex.exec(content)) !== null) faqs.push({ q: m[1].trim(), a: m[2].trim() });
  const jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);
  const jsonLd = jsonMatch?.[1]?.trim();
  if (faqs.length === 0) return <div className="prose prose-sm max-w-none text-gray-800 [&_h2]:text-sm [&_h2]:font-bold [&_p]:text-[13px] [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[11px]"><ReactMarkdown>{content}</ReactMarkdown></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm mb-1">
        <span className="text-lg">❓</span><span className="font-bold">FAQ 미리보기</span>
        <span className="text-xs text-gray-400 ml-auto">{faqs.length}개 질문</span>
      </div>
      {faqs.map((faq, i) => (
        <button key={i} onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full text-left border rounded-xl overflow-hidden hover:shadow-sm transition-all">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
            <span className="text-sm font-medium">{faq.q}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openIdx === i ? "rotate-180" : ""}`} />
          </div>
          {openIdx === i && <div className="px-4 py-3 text-sm text-gray-600 border-t leading-relaxed whitespace-pre-wrap">{faq.a}</div>}
        </button>
      ))}
      {jsonLd && (
        <div className="rounded-xl overflow-hidden border">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-gray-400 text-xs">
            <span>📋 FAQPage JSON-LD</span>
            <div className="flex gap-2">
              {(() => { try { JSON.parse(jsonLd); return <span className="text-green-400">✅ JSON 유효</span>; } catch { return <span className="text-red-400">❌ JSON 오류</span>; } })()}
              <button onClick={() => navigator.clipboard.writeText(`<script type="application/ld+json">\n${jsonLd}\n</script>`)} className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-green-400">복사</button>
            </div>
          </div>
          <pre className="p-4 bg-gray-950 text-green-400 text-[11px] overflow-x-auto max-h-[200px]">{(() => { try { return JSON.stringify(JSON.parse(jsonLd), null, 2); } catch { return jsonLd; } })()}</pre>
        </div>
      )}
    </div>
  );
}

function AdBannerPreview({ content, color }: { content: string; color: string }) {
  const gradients = ["from-purple-600 to-pink-500", "from-blue-600 to-cyan-500", "from-amber-500 to-orange-600", "from-rose-500 to-red-600"];
  const blocks = content.split(/##\s*배너\s*\d+[:\s]*/i).filter(s => s.trim());
  const banners = blocks.map(block => ({
    headline: block.match(/헤드라인[:\s]+(.+)/)?.[1]?.trim() || "",
    subcopy: block.match(/서브카피[:\s]+(.+)/)?.[1]?.trim() || "",
    cta: block.match(/CTA[^:\n]*[:\s]+(.+)/)?.[1]?.trim() || "자세히 보기",
    strategy: block.match(/(?:전략|설명)[^:\n]*[:\s]+(.+)/)?.[1]?.trim() || "",
  })).filter(b => b.headline);
  if (banners.length === 0) return <div className="prose prose-sm max-w-none text-gray-800 [&_h2]:text-sm [&_h2]:font-bold [&_p]:text-[13px]"><ReactMarkdown>{content}</ReactMarkdown></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">📢</span><span className="font-bold">광고 배너 미리보기</span>
        <span className="text-xs text-gray-400 ml-auto">{banners.length}종</span>
      </div>
      <div className={`grid gap-3 ${banners.length >= 3 ? "grid-cols-3" : banners.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-[200px]"}`}>
        {banners.map((b, i) => (
          <div key={i} className={`rounded-xl p-5 text-white bg-gradient-to-br ${gradients[i % gradients.length]} flex flex-col justify-between aspect-[4/5] shadow-lg`}>
            <div>
              <p className="text-base font-black leading-tight drop-shadow">{b.headline}</p>
              <p className="text-xs opacity-80 mt-2 leading-relaxed">{b.subcopy}</p>
            </div>
            <div className="mt-3 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-bold text-center">{b.cta}</div>
          </div>
        ))}
      </div>
      {banners[0]?.strategy && <p className="text-xs text-gray-500">📊 전략: {banners[0].strategy}</p>}
    </div>
  );
}

function SocialPreview({ content, color }: { content: string; color: string }) {
  const [current, setCurrent] = useState(0);
  const slideRegex = /###\s*(\d+)장[:\s]*(.*)/gi;
  const splitParts = content.split(slideRegex).filter(s => s.trim());
  const slides: { num: string; title: string; body: string }[] = [];
  for (let i = 0; i + 2 < splitParts.length; i += 3) {
    slides.push({ num: splitParts[i], title: splitParts[i + 1].trim(), body: splitParts[i + 2].trim() });
  }
  const hashtagMatch = content.match(/(#[^\s#]+[\s]*){2,}/);
  const hashtags = hashtagMatch?.[0]?.trim() || "";
  if (slides.length === 0) return <div className="prose prose-sm max-w-none text-gray-800 [&_h3]:text-[13px] [&_h3]:font-bold [&_p]:text-[13px]"><ReactMarkdown>{content}</ReactMarkdown></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm mb-1">
        <span className="text-lg">📱</span><span className="font-bold">인스타그램 카드뉴스</span>
        <span className="text-xs text-gray-400 ml-auto">{slides.length}장</span>
      </div>
      <div className="max-w-[300px] mx-auto">
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs font-bold text-gray-700">brand_official</span>
            <span className="text-[10px] text-blue-500 ml-auto">팔로우</span>
          </div>
          <div className="aspect-square flex items-center justify-center p-6" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
            <div className="text-white text-center space-y-2">
              <p className="text-lg font-black leading-tight">{slides[current]?.title}</p>
              <div className="text-xs opacity-90 leading-relaxed whitespace-pre-wrap">{slides[current]?.body.slice(0, 200)}{(slides[current]?.body.length || 0) > 200 ? "…" : ""}</div>
            </div>
          </div>
          <div className="flex justify-center gap-1 py-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-blue-500" : "bg-gray-300"}`} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 px-1">
          <button onClick={() => setCurrent(Math.max(0, current - 1))} className="hover:text-gray-700">◀ 이전</button>
          <span>{current + 1} / {slides.length}장</span>
          <button onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))} className="hover:text-gray-700">다음 ▶</button>
        </div>
      </div>
      {hashtags && <p className="text-xs text-blue-500 text-center">{hashtags}</p>}
    </div>
  );
}

function JsonLdPreview({ content, color }: { content: string; color: string }) {
  const codeBlocks = Array.from(content.matchAll(/```json\n([\s\S]+?)\n```/g)).map(m => m[1].trim());
  const titles = Array.from(content.matchAll(/##\s*(.+?)(?:\n|$)/g)).map(m => m[1].trim());
  if (codeBlocks.length === 0) return <div className="prose prose-sm max-w-none text-gray-800 [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[11px]"><ReactMarkdown>{content}</ReactMarkdown></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">🔗</span><span className="font-bold">JSON-LD Schema 미리보기</span>
        <span className="text-xs text-gray-400 ml-auto">{codeBlocks.length}개 스키마</span>
      </div>
      {codeBlocks.map((code, i) => {
        let isValid = false;
        let formatted = code;
        try { formatted = JSON.stringify(JSON.parse(code), null, 2); isValid = true; } catch {}
        return (
          <div key={i} className="rounded-xl overflow-hidden border">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
              <span className="text-xs text-gray-400">{titles[i] || `Schema ${i + 1}`}</span>
              <div className="flex gap-2 text-xs">
                <span className={isValid ? "text-green-400" : "text-red-400"}>{isValid ? "✅ JSON 유효" : "❌ JSON 오류"}</span>
                <button onClick={() => navigator.clipboard.writeText(`<script type="application/ld+json">\n${formatted}\n</script>`)} className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-green-400">📋 복사</button>
                <button onClick={() => window.open("https://validator.schema.org", "_blank")} className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-blue-400">🔍 검증</button>
              </div>
            </div>
            <pre className="p-4 bg-gray-950 text-green-400 text-[11px] overflow-x-auto max-h-[300px]">{formatted}</pre>
          </div>
        );
      })}
      <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
        💡 <strong>적용 방법:</strong> 위 코드를 {"<head>"} 태그 안에 {"<script type=\"application/ld+json\">"} 블록으로 추가하세요. &quot;📋 복사&quot; 버튼으로 완전한 script 태그가 복사됩니다.
      </div>
    </div>
  );
}

function BlogPreview({ content, color, slug, brandName }: { content: string; color: string; slug?: string; brandName?: string }) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] || "제목 없음";
  const descMatch = content.match(/^(?!#)(.{20,})/m);
  const description = descMatch?.[1]?.slice(0, 160) || "";

  return (
    <div className="space-y-3">
      <div className="border rounded-xl p-4 bg-white">
        <p className="text-xs text-gray-400 mb-1">🔍 Google 검색 미리보기</p>
        <p className="text-blue-600 text-sm font-medium">{title}{brandName ? ` — ${brandName}` : ""}</p>
        <p className="text-green-700 text-xs">{slug ? `${slug}.bmp.ai/content/...` : "bmp.ai/content/..."}</p>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{description}...</p>
      </div>
      <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed
        [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
        [&_h3]:text-[13px] [&_h3]:font-bold [&_p]:text-[13px] [&_li]:text-[13px]
        [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[11px] [&_pre]:overflow-x-auto
        [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px]">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

function ContentPreview({ content, contentType, color, slug, brandName }: { content: string; contentType: string; color: string; slug?: string; brandName?: string }) {
  // Each preview returns null if parsing fails → fallback to markdown
  const previewMap: Record<string, React.ReactNode> = {
    youtube: <YouTubePreview content={content} color={color} />,
    faq: <FaqPreview content={content} color={color} />,
    ad: <AdBannerPreview content={content} color={color} />,
    community: <SocialPreview content={content} color={color} />,
    jsonld: <JsonLdPreview content={content} color={color} />,
    blog: <BlogPreview content={content} color={color} slug={slug} brandName={brandName} />,
  };
  const preview = previewMap[contentType];
  if (preview) return <>{preview}</>;

  // Default: plain markdown
  return (
    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed
      [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
      [&_h3]:text-[13px] [&_h3]:font-bold [&_p]:text-[13px] [&_li]:text-[13px]
      [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[11px] [&_pre]:overflow-x-auto
      [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px]">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
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
  const [expandedKhub, setExpandedKhub] = useState<{ id: string; title: string; content: string } | null>(null);
  const [khubDocLoading, setKhubDocLoading] = useState<string | null>(null);

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
  const [clMode, setClMode] = useState<"generate" | "improve">("improve");
  const [clImproveResult, setClImproveResult] = useState<any>(null);
  const [clImproveLoading, setClImproveLoading] = useState(false);
  const [clImproveLlm, setClImproveLlm] = useState<"claude" | "gpt">("claude");
  const [clSavedContents, setClSavedContents] = useState<any[]>([]);
  const [clViewContent, setClViewContent] = useState<any>(null);
  const [clSavedImproves, setClSavedImproves] = useState<any[]>([]);
  const [clViewImprove, setClViewImprove] = useState<any>(null);

  // WordPress CMS connection state
  const [wpConnection, setWpConnection] = useState<any>(null);
  const [wpPublishing, setWpPublishing] = useState(false);

  const checkWpConnection = async () => {
    try {
      const sb = createClient();
      const { data } = await sb.from("bmp_cms_connections")
        .select("*")
        .eq("hub_slug", client)
        .eq("cms_type", "wordpress_com")
        .eq("is_active", true)
        .single();
      if (data) setWpConnection(data);
    } catch {}
  };

  const connectWordPress = async () => {
    try {
      const res = await fetch(`/api/wordpress-connect?slug=${client}&partner=${partner}`);
      const data = await res.json();
      if (data.auth_url) window.location.href = data.auth_url;
    } catch (e) { console.error("WP connect error:", e); }
  };

  const publishToWordPress = async (title: string, contentMd: string, contentId?: string) => {
    if (!wpConnection) return;
    setWpPublishing(true);
    try {
      const res = await fetch("/api/wordpress-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hub_slug: client, title, content_md: contentMd, content_id: contentId }),
      });
      const data = await res.json();
      setWpPublishing(false);
      if (data.success) {
        alert(`✅ WordPress 발행 완료!\n\n${data.wp_url}\n\n상태: ${data.wp_status === "draft" ? "임시글 (검토 후 발행)" : "발행됨"}`);
        window.open(data.wp_edit_url, "_blank");
      } else {
        if (data.code === "TOKEN_EXPIRED") { setWpConnection(null); alert("⚠️ WordPress 인증이 만료되었습니다. 재연동해주세요."); }
        else alert("❌ 발행 실패: " + (data.error || "알 수 없는 오류"));
      }
    } catch (e: any) { setWpPublishing(false); alert("❌ 발행 오류: " + e.message); }
  };

  // Check WP connection on content lab open + handle callback redirect
  useEffect(() => {
    if (activeSection === "contentlab" && client) {
      checkWpConnection();
      const params = new URLSearchParams(window.location.search);
      if (params.get("wp_connected") === "true") {
        checkWpConnection();
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [activeSection, client]);

  const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";
  const supabaseClient = createClient();
  const loadSavedContents = async () => {
    try {
      const { data } = await supabaseClient.from("bmp_generated_contents")
        .select("id,title,slug,content_type,llm_provider,llm_model,status,char_count,generation_ms,created_at")
        .eq("hub_slug", client)
        .neq("content_type", "improve")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setClSavedContents(data);
    } catch {}
  };

  const loadSavedImproves = async () => {
    try {
      const { data } = await supabaseClient.from("bmp_generated_contents")
        .select("id,title,slug,content_type,llm_provider,llm_model,status,char_count,body_md,generation_ms,created_at,metadata")
        .eq("hub_slug", client)
        .eq("content_type", "improve")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setClSavedImproves(data);
    } catch {}
  };

  const saveImproveResult = async (result: any, llm: string) => {
    if (!result?.success || !result?.improvements) return;
    try {
      await supabaseClient.from("bmp_generated_contents").insert({
        hub_slug: client,
        partner_slug: partner,
        content_type: "improve",
        title: `페이지 개선 분석 — ${llm === "claude" ? "Claude" : "GPT-4o"} (${result.page_count || 0}페이지)`,
        slug: `improve-${llm}-${Date.now()}`,
        body_md: result.improvements,
        llm_provider: llm,
        llm_model: result.llm_name || llm,
        generation_ms: result.elapsed_ms || 0,
        char_count: result.improvements?.length || 0,
        status: "draft",
        metadata: { page_count: result.page_count, llm_focus: result.llm_focus },
      });
      loadSavedImproves();
    } catch (e) { console.error("Save improve error:", e); }
  };

  // Auto-load saved contents when contentlab tab opens
  useEffect(() => {
    if (activeSection === "contentlab" && client) { loadSavedContents(); loadSavedImproves(); }
  }, [activeSection, client]);

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
          const statusRes = await fetch(`${BAWEE_EF}/geobh-api/analysis-status?slug=${partner}&client=${client}`);
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
      // Build history from previous messages (for multi-turn)
      const prevMsgs = messages.filter(m => !m.isLoading).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${BAWEE_EF}/geobh-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: client, query: query.trim(), history: prevMsgs }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.success ? data.answer : "죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.",
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

  const brandDomain = eeatData?.analysis?.url?.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "") || client;
  const suggestedQuestions = [
    sc ? `EEAT ${sc.overall_grade}등급인데, 어떻게 개선해야 해?` : `${brandDomain} EEAT 점수는?`,
    somData?.latest ? `SoM ${somData.latest.overall_share}%에서 점유율을 높이려면?` : "AI 검색 점유율을 높이려면?",
    "경쟁사 대비 우리 브랜드 강점과 약점은?",
    "지금 당장 실행할 수 있는 GEO 액션 3가지",
    sc?.authoritativeness?.score && sc.authoritativeness.score < 50 ? "권위성 점수가 낮은데 어떻게 올려?" : "콘텐츠 전략을 추천해줘",
    "Schema.org 마크업 적용하면 효과가 있을까?",
  ].filter(Boolean);

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
                                const res = await fetch(BAWEE_EF + "/geobh-report-with-commentary?ef=" + r.ef + "&slug=" + client);
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
              if (d.success) { setClHistory(prev => [...prev, d]); loadSavedContents(); }
            } catch {}
            setClGenLoading(false);
          };
          return (
            <div className="space-y-6">
              {/* Header + Mode Switcher */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Wand2 className="w-5 h-5" style={{ color }} /> 콘텐츠 랩
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {clMode === "improve" ? "크롤링된 실제 페이지를 AI가 분석하여 개선안을 제시합니다" : "EEAT 분석 결과 기반 AI 콘텐츠 생성"}
                  </p>
                </div>
                <div className="flex rounded-lg overflow-hidden border bg-white text-xs">
                  <button onClick={() => setClMode("improve")}
                    className={`px-3 py-1.5 font-semibold transition-all ${clMode === "improve" ? "text-white" : "text-gray-500"}`}
                    style={clMode === "improve" ? { backgroundColor: color } : {}}>
                    🔍 페이지 개선
                  </button>
                  <button onClick={() => setClMode("generate")}
                    className={`px-3 py-1.5 font-semibold transition-all ${clMode === "generate" ? "text-white" : "text-gray-500"}`}
                    style={clMode === "generate" ? { backgroundColor: color } : {}}>
                    ✍️ 콘텐츠 생성
                  </button>
                </div>
              </div>

              {/* WordPress Connection Banner */}
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs ${wpConnection ? "bg-blue-50/50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center gap-2">
                  <span>{wpConnection ? "🌐" : "🔗"}</span>
                  {wpConnection ? (
                    <span className="text-blue-700 font-medium">WordPress 연동됨 — {wpConnection.site_url || wpConnection.blog_url || "연결됨"}</span>
                  ) : (
                    <span className="text-gray-500">WordPress 연동 시 AI 콘텐츠를 사이트에 바로 발행할 수 있습니다</span>
                  )}
                </div>
                {wpConnection ? (
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">연동 완료</span>
                ) : (
                  <button onClick={connectWordPress}
                    className="px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-blue-600 font-medium hover:bg-blue-50 transition-all">
                    WordPress 연동
                  </button>
                )}
              </div>

              {/* ── PAGE IMPROVE MODE ── */}
              {clMode === "improve" && (
                <div className="space-y-4">
                  {/* LLM Selection */}
                  <div className="flex items-center gap-3">
                    {([
                      { key: "claude" as const, name: "Claude", sub: "E-E-A-T 구조 + Schema.org JSON-LD", clr: "#d97706" },
                      { key: "gpt" as const, name: "GPT-4o", sub: "마케팅 카피 + CTA + 전환율 최적화", clr: "#10a37f" },
                    ]).map(l => (
                      <button key={l.key} onClick={() => setClImproveLlm(l.key)}
                        className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${clImproveLlm === l.key ? "shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                        style={clImproveLlm === l.key ? { borderColor: l.clr, backgroundColor: l.clr + "06" } : {}}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.clr }} />
                          <span className="text-sm font-bold text-gray-900">{l.name}</span>
                          {clImproveLlm === l.key && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: l.clr }}>선택됨</span>}
                        </div>
                        <p className="text-[11px] text-gray-500">{l.sub}</p>
                      </button>
                    ))}
                    <button onClick={async () => {
                      setClImproveLoading(true); setClImproveResult(null);
                      try {
                        const r = await fetch(efBase + "/geobh-content-improve", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ slug: client, llm: clImproveLlm, limit: 10 }),
                        });
                        const result = await r.json();
                        setClImproveResult(result);
                        if (result.success) saveImproveResult(result, clImproveLlm);
                      } catch {}
                      setClImproveLoading(false);
                    }} disabled={clImproveLoading}
                      className="px-5 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex-shrink-0"
                      style={{ backgroundColor: clImproveLlm === "claude" ? "#d97706" : "#10a37f" }}>
                      {clImproveLoading ? "분석 중..." : "🚀 분석"}
                    </button>
                  </div>

                  {/* Loading */}
                  {clImproveLoading && (
                    <div className="bg-white rounded-xl border p-8 flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color }} />
                      <span className="text-sm text-gray-500">
                        {clImproveLlm === "claude" ? "Claude가 E-E-A-T 구조와 Schema.org를 분석 중..." : "GPT-4o가 마케팅 카피와 전환율을 분석 중..."}
                      </span>
                      <span className="text-xs text-gray-400">최대 10개 페이지 · 약 30~60초 소요</span>
                    </div>
                  )}

                  {/* Result */}
                  {clImproveResult?.success && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: clImproveLlm === "claude" ? "#d97706" : "#10a37f" }} />
                          <span className="text-sm font-bold">{clImproveResult.llm_name}</span>
                          <span className="text-xs text-gray-400">{clImproveResult.llm_focus}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{clImproveResult.page_count}페이지</span>
                          <span>{(clImproveResult.elapsed_ms / 1000).toFixed(1)}초</span>
                          <button onClick={() => navigator.clipboard.writeText(clImproveResult.improvements)}
                            className="px-2 py-1 rounded border hover:bg-gray-100 text-gray-600">복사</button>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border overflow-hidden">
                        <div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                          <div className="p-5 text-[12.5px] text-gray-700 leading-relaxed
                            [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-3
                            [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:pb-1.5 [&_h2]:border-b [&_h2]:border-gray-100
                            [&_h3]:text-[12.5px] [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-3 [&_h3]:mb-1
                            [&_h4]:text-[12px] [&_h4]:font-semibold [&_h4]:text-gray-700 [&_h4]:mt-2
                            [&_p]:my-1.5 [&_li]:text-[12px] [&_li]:leading-relaxed
                            [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4
                            [&_code]:text-[11px] [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
                            [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[11px] [&_pre]:overflow-x-auto [&_pre]:my-3
                            [&_strong]:text-gray-900">
                            <ReactMarkdown>{clImproveResult.improvements}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                      {/* Compare with other LLM */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">다른 AI 관점:</span>
                        <button onClick={() => { setClImproveLlm(clImproveLlm === "claude" ? "gpt" : "claude"); }}
                          className="text-xs px-3 py-1.5 rounded-lg border hover:shadow-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: clImproveLlm === "claude" ? "#10a37f" : "#d97706" }} />
                          {clImproveLlm === "claude" ? "GPT-4o 관점으로 분석" : "Claude 관점으로 분석"}
                        </button>
                      </div>
                    </div>
                  )}

                  {clImproveResult && !clImproveResult.success && (
                    <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                      <p className="text-sm text-red-700">오류: {clImproveResult.error}</p>
                    </div>
                  )}

                  {/* ── 저장된 개선 분석 이력 ── */}
                  {clSavedImproves.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-700">이전 분석 이력</h4>
                        <button onClick={loadSavedImproves} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> 새로고침
                        </button>
                      </div>

                      {/* 상세 뷰 */}
                      {clViewImprove && (
                        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clViewImprove.llm_provider === "claude" ? "#d97706" : "#10a37f" }} />
                              <span className="text-sm font-bold">{clViewImprove.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400">{new Date(clViewImprove.created_at).toLocaleDateString("ko-KR")} {new Date(clViewImprove.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
                              <button onClick={() => { navigator.clipboard.writeText(clViewImprove.body_md || ""); }}
                                className="px-2 py-1 rounded border hover:bg-gray-100 text-gray-600">복사</button>
                              <button onClick={() => setClViewImprove(null)}
                                className="px-2 py-1 rounded border hover:bg-gray-100 text-gray-600">✕ 닫기</button>
                            </div>
                          </div>
                          <div className="max-h-[60vh] overflow-y-auto p-5 text-[12.5px] text-gray-700 leading-relaxed
                            [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-3
                            [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:pb-1.5 [&_h2]:border-b [&_h2]:border-gray-100
                            [&_h3]:text-[12.5px] [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-3 [&_h3]:mb-1
                            [&_p]:my-1.5 [&_li]:text-[12px] [&_li]:leading-relaxed
                            [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4
                            [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[11px] [&_pre]:overflow-x-auto
                            [&_strong]:text-gray-900">
                            <ReactMarkdown>{clViewImprove.body_md || ""}</ReactMarkdown>
                          </div>
                          <ContentActionBar
                            content={clViewImprove.body_md || ""}
                            contentType="improve"
                            title={clViewImprove.title || "개선 분석"}
                            color={color}
                            wpConnection={wpConnection}
                            wpPublishing={wpPublishing}
                            onWpPublish={() => publishToWordPress(
                              clViewImprove.title || "페이지 개선 분석",
                              clViewImprove.body_md || "",
                              clViewImprove.id
                            )}
                          />
                        </div>
                      )}

                      {/* 리스트 */}
                      <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b text-gray-500">
                              <th className="px-3 py-2 text-left font-medium">날짜</th>
                              <th className="px-3 py-2 text-left font-medium">AI</th>
                              <th className="px-3 py-2 text-center font-medium">페이지</th>
                              <th className="px-3 py-2 text-center font-medium">소요</th>
                              <th className="px-3 py-2 text-center font-medium">분량</th>
                              <th className="px-3 py-2 text-center font-medium">액션</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clSavedImproves.map((item: any) => (
                              <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => {
                                  if (clViewImprove?.id === item.id) { setClViewImprove(null); return; }
                                  if (!item.body_md) {
                                    supabaseClient.from("bmp_generated_contents")
                                      .select("id,title,body_md,llm_provider,created_at,metadata")
                                      .eq("id", item.id).single().then(({ data }) => { if (data) setClViewImprove(data); });
                                  } else { setClViewImprove(item); }
                                }}>
                                <td className="px-3 py-2.5 text-gray-600">
                                  {new Date(item.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                                  {" "}
                                  {new Date(item.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.llm_provider === "claude" ? "#d97706" : "#10a37f" }} />
                                    {item.llm_provider === "claude" ? "Claude" : "GPT-4o"}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center text-gray-500">{item.metadata?.page_count || "-"}</td>
                                <td className="px-3 py-2.5 text-center text-gray-500">{item.generation_ms ? (item.generation_ms / 1000).toFixed(1) + "s" : "-"}</td>
                                <td className="px-3 py-2.5 text-center text-gray-500">{item.char_count?.toLocaleString() || "-"}자</td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${clViewImprove?.id === item.id ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                                    {clViewImprove?.id === item.id ? "보는 중" : "보기"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── CONTENT GENERATE MODE (existing) ── */}
              {clMode === "generate" && (
              <div className="space-y-8">

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
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">{(clGenResult.elapsed_ms / 1000).toFixed(1)}s · {clGenResult.content?.length?.toLocaleString()}자</span>
                        {!clGenResult.published_url && clGenResult.status !== "published" && (
                          <button onClick={async () => {
                            const r = await fetch(efBase + "/geobh-content-gen", {
                              method: "POST", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ slug: client, content_type: clGenResult.content_type || clSelectedType, llm: clGenResult.llm, publish: true, title: clGenResult.content?.match(/^#\s+(.+)$/m)?.[1], custom_slug: clGenResult.content_slug }),
                            });
                            const d = await r.json();
                            if (d.published_url) { setClGenResult({ ...clGenResult, published_url: d.published_url, status: "published" }); loadSavedContents(); }
                          }} className="px-3 py-1 rounded text-white text-xs font-bold" style={{ backgroundColor: color }}>
                            🚀 발행
                          </button>
                        )}
                        {(clGenResult.published_url || clGenResult.status === "published") && (
                          <span className="px-3 py-1 rounded bg-green-50 text-green-700 text-xs font-bold">✅ 발행됨</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 max-h-[500px] overflow-y-auto">
                      <ContentPreview
                        content={clGenResult.content}
                        contentType={clGenResult.content_type || clSelectedType || "blog"}
                        color={color}
                        slug={client}
                        brandName={hubConfig?.brand_name}
                      />
                    </div>
                    <ContentActionBar
                      content={clGenResult.content}
                      contentType={clGenResult.content_type || clSelectedType || "blog"}
                      title={clGenResult.content?.match(/^#\s+(.+)$/m)?.[1] || "콘텐츠"}
                      color={color}
                      wpConnection={wpConnection}
                      wpPublishing={wpPublishing}
                      onWpPublish={() => publishToWordPress(
                        clGenResult.content?.match(/^#\s+(.+)$/m)?.[1] || "콘텐츠",
                        clGenResult.content,
                        clGenResult.id
                      )}
                    />
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

              {/* Content History from DB (auto-loaded) */}
              {(() => {
                const filteredContents = clSelectedType
                  ? clSavedContents.filter((c: any) => c.content_type === clSelectedType)
                  : clSavedContents;
                const filterLabel = clSelectedType ? CL_TYPES.find(t => t.key === clSelectedType)?.label || clSelectedType : null;
                return (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-700">📁 콘텐츠 이력 {filteredContents.length > 0 ? `(${filteredContents.length}건)` : ""}</h4>
                    {filterLabel && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: color, color }}>
                        {filterLabel}
                        <button onClick={() => setClSelectedType(null)} className="ml-0.5 hover:opacity-70">✕</button>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {filterLabel && (
                      <button onClick={() => setClSelectedType(null)} className="text-xs text-gray-500 hover:underline">전체 보기</button>
                    )}
                    <button onClick={loadSavedContents} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> 새로고침
                    </button>
                  </div>
                </div>

                {/* Inline Content Viewer — 테이블 위 표시 */}
                {clViewContent && (
                  <div className="mb-4 bg-white rounded-xl border overflow-hidden shadow-sm" id="cl-viewer">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clViewContent.llm_provider === "claude" ? "#d97706" : clViewContent.llm_provider === "gpt" ? "#10a37f" : clViewContent.llm_provider === "gemini" ? "#4285f4" : "#000" }} />
                        <span className="text-sm font-bold">{clViewContent.title || clViewContent.slug}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${clViewContent.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {clViewContent.status === "published" ? "발행됨" : "초안"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button onClick={() => setClViewContent(null)}
                          className="px-2 py-1 rounded border hover:bg-gray-100 text-gray-600">✕ 닫기</button>
                      </div>
                    </div>
                    <div className="p-4 max-h-[500px] overflow-y-auto">
                      {clViewContent.status !== "published" && (
                        <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-2">
                          <span>🔒</span>
                          <span>비공개 미리보기 — 발행 전에는 외부에서 접근할 수 없습니다</span>
                        </div>
                      )}
                      <ContentPreview
                        content={clViewContent.body_md || ""}
                        contentType={clViewContent.content_type || "blog"}
                        color={color}
                        slug={client}
                        brandName={hubConfig?.brand_name}
                      />
                    </div>
                    <ContentActionBar
                      content={clViewContent.body_md || ""}
                      contentType={clViewContent.content_type || "blog"}
                      title={clViewContent.title || clViewContent.slug || "콘텐츠"}
                      color={color}
                      wpConnection={wpConnection}
                      wpPublishing={wpPublishing}
                      onWpPublish={() => publishToWordPress(
                        clViewContent.title || clViewContent.slug || "콘텐츠",
                        clViewContent.body_md || "",
                        clViewContent.id
                      )}
                    />
                  </div>
                )}

                {filteredContents.length > 0 && (
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">제목</th>
                          <th className="text-center px-3 py-2 font-medium w-16">유형</th>
                          <th className="text-center px-3 py-2 font-medium w-14">AI</th>
                          <th className="text-center px-3 py-2 font-medium w-14">시간</th>
                          <th className="text-center px-3 py-2 font-medium w-14">글자수</th>
                          <th className="text-center px-3 py-2 font-medium w-14">상태</th>
                          <th className="text-center px-3 py-2 font-medium w-20">생성일</th>
                          <th className="text-center px-3 py-2 font-medium w-28">액션</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredContents.map((c: any) => {
                          const llmClr = c.llm_provider === "claude" ? "#d97706" : c.llm_provider === "gpt" ? "#10a37f" : c.llm_provider === "gemini" ? "#4285f4" : "#000";
                          const isViewing = clViewContent?.id === c.id;
                          return (
                            <tr key={c.id} className={`hover:bg-gray-50 ${isViewing ? "bg-blue-50" : ""}`}>
                              <td className="px-3 py-2 font-medium text-gray-900 truncate max-w-[180px]">{c.title || c.slug}</td>
                              <td className="px-3 py-2 text-center text-gray-500">{CL_TYPES.find(t => t.key === c.content_type)?.label || c.content_type}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: llmClr }} />
                                  <span className="text-gray-600">{c.llm_provider === "claude" ? "Claude" : c.llm_provider === "gpt" ? "GPT" : c.llm_provider === "gemini" ? "Gemini" : "Grok"}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center text-gray-500">{c.generation_ms ? `${(c.generation_ms / 1000).toFixed(1)}s` : "-"}</td>
                              <td className="px-3 py-2 text-center text-gray-500">{c.char_count?.toLocaleString() || "-"}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                  {c.status === "published" ? "발행" : "초안"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center text-gray-400">{new Date(c.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                <button onClick={async () => {
                                  if (isViewing) { setClViewContent(null); return; }
                                  try {
                                    const { data: rows } = await supabaseClient.from("bmp_generated_contents")
                                      .select("id,title,slug,content_type,llm_provider,llm_model,status,char_count,body_md,generation_ms")
                                      .eq("id", c.id)
                                      .limit(1);
                                    if (rows?.[0]) {
                                      setClViewContent(rows[0]);
                                      setTimeout(() => document.getElementById("cl-viewer")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                                    }
                                  } catch (e) { console.error("보기 에러:", e); }
                                }} className={`px-1.5 py-0.5 rounded border text-[10px] ${isViewing ? "bg-blue-600 text-white border-blue-600" : "text-blue-600 hover:bg-blue-50"}`}>
                                  {isViewing ? "닫기" : "보기"}
                                </button>
                                {c.status !== "published" && (
                                  <button onClick={async () => {
                                    try {
                                      const r = await fetch(efBase + "/geobh-content-gen", {
                                        method: "POST", headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ slug: client, content_type: c.content_type, llm: c.llm_provider, publish: true, title: c.title, custom_slug: c.slug }),
                                      });
                                      const d = await r.json();
                                      if (d.published_url || d.success) { alert("✅ 발행되었습니다"); }
                                      loadSavedContents();
                                    } catch (e) { console.error("발행 에러:", e); alert("발행 중 오류가 발생했습니다"); }
                                  }} className="px-1.5 py-0.5 rounded text-white text-[10px] font-bold" style={{ backgroundColor: color }}>
                                    발행
                                  </button>
                                )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredContents.length === 0 && clSavedContents.length > 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    선택한 유형({filterLabel})의 콘텐츠가 없습니다.
                    <button onClick={() => setClSelectedType(null)} className="ml-2 text-blue-500 hover:underline">전체 보기</button>
                  </div>
                )}
                {clSavedContents.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">아직 생성된 콘텐츠가 없습니다. 위에서 콘텐츠를 생성해보세요.</div>
                )}
              </div>
                ); })()}
            </div>
            )} {/* close generate mode */}
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
                <div className="flex items-center gap-2">
                  {khubRecs?.diagnosis?.grade && (
                    <span className="text-xs text-gray-500">
                      등급 {khubRecs.diagnosis.grade} · {khubRecs.diagnosis.overall_score ?? "—"}점
                    </span>
                  )}
                  {expandedKhub && (
                    <button onClick={() => setExpandedKhub(null)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      ← 목록으로
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {/* Expanded document view */}
                {expandedKhub ? (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">{expandedKhub.title}</h4>
                    <div className="max-h-[500px] overflow-y-auto rounded-xl bg-gray-50 p-5 border" style={{ scrollbarWidth: "thin" }}>
                      <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:text-sm prose-li:text-[13px] prose-p:text-[13px]">
                        <ReactMarkdown>{expandedKhub.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : khubRecsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                    <span className="ml-2 text-sm text-gray-400">가이드 검색 중...</span>
                  </div>
                ) : khubRecs?.recommendations?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {khubRecs.recommendations.map((rec: any, i: number) => (
                      <button key={rec.id || i}
                        onClick={async () => {
                          if (!rec.id) return;
                          setKhubDocLoading(rec.id);
                          try {
                            const res = await fetch(`${BAWEE_EF}/geobh-khub-bridge/document?id=${rec.id}`);
                            const d = await res.json();
                            if (d.success && d.document) {
                              setExpandedKhub({ id: rec.id, title: d.document.title || rec.title, content: d.document.content || rec.content_snippet });
                            } else {
                              setExpandedKhub({ id: rec.id, title: rec.title, content: rec.content_snippet || "내용을 불러올 수 없습니다." });
                            }
                          } catch {
                            setExpandedKhub({ id: rec.id, title: rec.title, content: rec.content_snippet || "내용을 불러올 수 없습니다." });
                          }
                          setKhubDocLoading(null);
                        }}
                        className="text-left p-4 rounded-xl border hover:shadow-md hover:border-blue-200 transition-all group bg-gray-50/50"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-sm mt-0.5">
                            {khubDocLoading === rec.id ? "⏳" : rec.project_code === "BH_COMMON" ? "📘" : rec.project_code === "GEO_COMMERCE" ? "🏪" : "📄"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {rec.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rec.content_snippet}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{rec.project_code}</span>
                              <span className="text-[10px] text-gray-400">{rec.relevance_reason}</span>
                              <span className="text-[10px] text-blue-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 보기 →</span>
                            </div>
                          </div>
                        </div>
                      </button>
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
