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
  FlaskConical,
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
  const [activeSection, setActiveSection] = useState<"overview" | "analysis" | "citation" | "som" | "compliance" | "competitor" | "contentlab" | "brandhub" | "jsonld" | "lift" | "abtest" | "services" | "chat">("overview");

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
  const [clCrawledPages, setClCrawledPages] = useState<any[]>([]);
  const [clSelectedPage, setClSelectedPage] = useState<any>(null);
  const [clPageListExpanded, setClPageListExpanded] = useState(false);

  // Gamma Packaging state
  const [gammaLoading, setGammaLoading] = useState(false);
  const [gammaResult, setGammaResult] = useState<any>(null);
  const [gammaFormat, setGammaFormat] = useState<string>("presentation");
  const [gammaDimensions, setGammaDimensions] = useState<string>("16x9");
  const [gammaExport, setGammaExport] = useState<string>("pptx");
  const [gammaSource, setGammaSource] = useState<{ title: string; content: string; type?: string; llm?: string } | null>(null);
  const [gammaHistory, setGammaHistory] = useState<any[]>([]);
  const [clPageImproveResult, setClPageImproveResult] = useState<any>(null);
  const [clPageImproveLoading, setClPageImproveLoading] = useState(false);

  // WordPress CMS connection state
  const [wpConnection, setWpConnection] = useState<any>(null);
  const [wpPublishing, setWpPublishing] = useState(false);

  // A/B Test states
  const [abTests, setAbTests] = useState<any[]>([]);
  const [abTestsLoading, setAbTestsLoading] = useState(false);
  const [abSelectedTest, setAbSelectedTest] = useState<any>(null);
  const [abOriginalJsonld, setAbOriginalJsonld] = useState<any>(null);
  const [abHubJsonld, setAbHubJsonld] = useState<any>(null);
  const [abCopied, setAbCopied] = useState<number | false>(false);
  const [abFetched, setAbFetched] = useState(false);

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
        .in("content_type", ["improve", "page_improve"])
        .order("created_at", { ascending: false })
        .limit(30);
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

  const loadCrawledPages = async () => {
    try {
      const siteDomain = analysisStatus?.brand?.site_domain;
      if (!siteDomain) return;
      const domain = siteDomain.replace(/\/$/, "");
      const { data } = await supabaseClient.from("geo_gpt_firecrawl_raw")
        .select("id,url,title,site_domain,status_code,created_at")
        .or(`site_domain.eq.${domain},site_domain.eq.${domain}/`)
        .order("created_at", { ascending: true })
        .limit(50);
      if (data) setClCrawledPages(data);
    } catch (e) { console.error("Load crawled pages error:", e); }
  };

  const loadPageDetail = async (pageId: number) => {
    try {
      const { data } = await supabaseClient.from("geo_gpt_firecrawl_raw")
        .select("id,url,title,markdown,status_code,created_at")
        .eq("id", pageId)
        .single();
      if (data) setClSelectedPage(data);
    } catch (e) { console.error("Load page detail error:", e); }
  };

  const improveSelectedPage = async () => {
    if (!clSelectedPage?.markdown) return;
    setClPageImproveLoading(true); setClPageImproveResult(null);
    try {
      const res = await fetch("/api/page-improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_url: clSelectedPage.url,
          page_title: clSelectedPage.title,
          page_markdown: clSelectedPage.markdown,
          llm: clImproveLlm,
          brand_name: hubConfig?.brand_name || client,
        }),
      });
      const result = await res.json();
      setClPageImproveResult(result);
      if (result.success) {
        // Auto-save to DB
        await supabaseClient.from("bmp_generated_contents").insert({
          hub_slug: client,
          partner_slug: partner,
          content_type: "page_improve",
          title: `${clSelectedPage.title || clSelectedPage.url} — ${result.llm_name} 개선`,
          slug: `page-improve-${Date.now()}`,
          body_md: result.improvements,
          llm_provider: result.llm,
          llm_model: result.llm_name,
          generation_ms: result.elapsed_ms || 0,
          char_count: result.char_count || 0,
          status: "draft",
          metadata: { original_url: clSelectedPage.url, original_title: clSelectedPage.title },
        });
        loadSavedImproves();
      }
    } catch (e) { console.error("Page improve error:", e); }
    setClPageImproveLoading(false);
  };

  // Auto-load saved contents when contentlab tab opens
  const loadGammaHistory = async () => {
    if (!client) return;
    const { data } = await supabaseClient.from("bmp_gamma_generations")
      .select("id,gamma_format,gamma_dimensions,export_as,gamma_url,export_url,credits_deducted,input_text_preview,input_content_type,status,elapsed_ms,created_at")
      .eq("client_slug", client).eq("status", "completed")
      .order("created_at", { ascending: false }).limit(20);
    if (data) setGammaHistory(data);
  };
  useEffect(() => {
    if (activeSection === "contentlab" && client) { loadSavedContents(); loadSavedImproves(); loadGammaHistory(); }
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

  // Load crawled pages when analysisStatus becomes available
  useEffect(() => {
    if (analysisStatus?.brand?.site_domain && activeSection === "contentlab") loadCrawledPages();
  }, [analysisStatus, activeSection]);

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

  /* ── A/B Test lazy fetch ── */
  useEffect(() => {
    if (activeSection === "abtest" && !abFetched && client) {
      setAbTestsLoading(true);
      setAbFetched(true);
      const sb = createClient();
      const domain = analysisStatus?.brand?.site_domain?.replace(/https?:\/\//, "").replace(/\/$/, "") || "";
      const clientSlug = (client as string).toLowerCase();
      sb.from("bmp_jsonld_ab_tests")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data }: { data: any }) => {
          const all = data || [];
          // Match by domain OR by client slug (handles punycode/Korean domains)
          const filtered = all.filter((t: any) => {
            const td = (t.site_domain || "").replace(/https?:\/\//, "").replace(/\/$/, "").toLowerCase();
            const tHub = (t.hub_url || "").toLowerCase();
            const tOrig = (t.original_url || "").toLowerCase();
            // Domain match
            if (domain && (td.includes(domain) || domain.includes(td))) return true;
            // Slug match — check if client slug appears in site_domain, hub_url, or original_url
            if (clientSlug && (td.includes(clientSlug) || tHub.includes(clientSlug) || tOrig.includes(clientSlug))) return true;
            return false;
          });
          const result = filtered.length > 0 ? filtered : all;
          setAbTests(result);
          if (result.length > 0) {
            setAbSelectedTest(result[0]);
            // Fetch JSON-LD for both URLs
            const t = result[0];
            const origUrl = t.original_url || analysisStatus?.brand?.site_domain;
            if (origUrl) {
              fetch(`${BAWEE_EF}/geobh-jsonld?url=${encodeURIComponent(origUrl)}`)
                .then(r => r.json()).then(d => setAbOriginalJsonld(d)).catch(() => {});
            }
            if (t.hub_url) {
              fetch(`${BAWEE_EF}/geobh-jsonld?url=${encodeURIComponent(t.hub_url)}`)
                .then(r => r.json()).then(d => setAbHubJsonld(d)).catch(() => {});
            }
          }
          setAbTestsLoading(false);
        });
    }
  }, [activeSection, client, analysisStatus]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  /* ── 404 state ── */
  if (!hubConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
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
    { key: "brandhub", label: "Brand Hub", icon: ExternalLink },
    { key: "jsonld", label: "JSON-LD 설치", icon: FileText },
    { key: "lift", label: "LIFT 설치", icon: Zap },
    { key: "abtest", label: "A/B 테스트", icon: FlaskConical },
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
    <div className="min-h-screen bg-[#F8F9FC]">
      <div className="bg-ambient" />
      <div className="relative z-10">
      {/* ════ Header ════ */}
      <header className="sticky top-0 z-50 border-b border-gray-100" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
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
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`flex items-center gap-1.5 px-2 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
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
      <main className="max-w-7xl mx-auto px-6 py-8">
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
            { key: "blog", label: "블로그/홈페이지", icon: "📝", desc: "EEAT 기반 SEO 콘텐츠", rec: "claude", gamma: true },
            { key: "faq", label: "FAQ + Schema", icon: "❓", desc: "구조화 FAQ + JSON-LD", rec: "claude", gamma: false },
            { key: "youtube", label: "YouTube 대본", icon: "🎬", desc: "영상 스크립트", rec: "gpt", gamma: false },
            { key: "ad", label: "광고 배너 카피", icon: "📢", desc: "헤드라인 + CTA 3종", rec: "gpt", gamma: false },
            { key: "community", label: "커뮤니티/SNS", icon: "💬", desc: "네이버/인스타/브런치", rec: "gemini", gamma: true },
            { key: "social", label: "소셜 트렌드", icon: "🐦", desc: "X 감성 분석 + 여론", rec: "grok", gamma: false },
            { key: "jsonld", label: "JSON-LD 구조화", icon: "🔗", desc: "Schema.org 코드", rec: "claude", gamma: false },
            { key: "story", label: "스토리/쇼츠", icon: "🎯", desc: "인스타/틱톡 세로 5장", rec: "gemini", gamma: true },
            { key: "presentation", label: "프레젠테이션", icon: "🎤", desc: "GEO 리포트 16:9", rec: "claude", gamma: true },
            { key: "landing", label: "랜딩페이지", icon: "🌐", desc: "캠페인 웹페이지", rec: "claude", gamma: true },
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
              if (d.success) { setClHistory(prev => [...prev, d]); loadSavedContents(); setGammaSource({ title: d.content?.match(/^#\s+(.+)$/m)?.[1] || d.content_label || "생성 결과", content: d.content, type: d.content_type || t, llm: d.llm || l }); setGammaResult(null); }
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

              {/* WordPress Connection Banner — hidden */}

              {/* ── PAGE IMPROVE MODE ── */}
              {clMode === "improve" && (
                <div className="space-y-4">
                  {/* LLM Selection Bar */}
                  <div className="flex items-center gap-3">
                    {([
                      { key: "claude" as const, name: "Claude", sub: "E-E-A-T 구조 개선", clr: "#d97706" },
                      { key: "gpt" as const, name: "GPT-4o", sub: "마케팅 + 전환율 최적화", clr: "#10a37f" },
                    ]).map(l => (
                      <button key={l.key} onClick={() => setClImproveLlm(l.key)}
                        className={`flex-1 p-2.5 rounded-xl border-2 text-left transition-all ${clImproveLlm === l.key ? "shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                        style={clImproveLlm === l.key ? { borderColor: l.clr, backgroundColor: l.clr + "06" } : {}}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.clr }} />
                          <span className="text-sm font-bold text-gray-900">{l.name}</span>
                          {clImproveLlm === l.key && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: l.clr }}>선택됨</span>}
                          <span className="text-[11px] text-gray-400 ml-auto">{l.sub}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* ── 선택된 페이지 상세 + AI 개선 (상단 배치) ── */}
                  {clSelectedPage && (
                    <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{clSelectedPage.title || "(제목 없음)"}</h4>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">{clSelectedPage.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={improveSelectedPage} disabled={clPageImproveLoading}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                            style={{ backgroundColor: clImproveLlm === "claude" ? "#d97706" : "#10a37f" }}>
                            {clPageImproveLoading ? "분석 중..." : `${clImproveLlm === "claude" ? "Claude" : "GPT-4o"}로 개선`}
                          </button>
                          <button onClick={() => { setClSelectedPage(null); setClPageImproveResult(null); }}
                            className="px-2 py-1 rounded border hover:bg-gray-100 text-gray-500 text-xs">✕</button>
                        </div>
                      </div>

                      {/* 원본 미리보기 (접힘) */}
                      <details className="border-b">
                        <summary className="px-4 py-2 text-xs text-gray-500 cursor-pointer hover:bg-gray-50">
                          📄 원본 콘텐츠 미리보기 ({clSelectedPage.markdown?.length?.toLocaleString() || 0}자)
                        </summary>
                        <div className="px-4 py-3 max-h-[300px] overflow-y-auto text-[11px] text-gray-600 leading-relaxed bg-gray-50/50 whitespace-pre-wrap">
                          {(clSelectedPage.markdown || "").slice(0, 3000)}
                          {(clSelectedPage.markdown || "").length > 3000 && <span className="text-gray-400">... (이하 생략)</span>}
                        </div>
                      </details>

                      {/* Loading */}
                      {clPageImproveLoading && (
                        <div className="p-8 flex flex-col items-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin" style={{ color }} />
                          <span className="text-sm text-gray-500">
                            {clImproveLlm === "claude" ? "Claude가 E-E-A-T 구조를 분석하고 개선 콘텐츠를 생성 중..." : "GPT-4o가 마케팅 관점으로 개선 콘텐츠를 생성 중..."}
                          </span>
                          <span className="text-xs text-gray-400">약 20~40초 소요</span>
                        </div>
                      )}

                      {/* 개선 결과 */}
                      {clPageImproveResult?.success && (
                        <div>
                          <div className="flex items-center justify-between px-4 py-2 border-b bg-green-50">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clImproveLlm === "claude" ? "#d97706" : "#10a37f" }} />
                              <span className="font-bold text-green-800">{clPageImproveResult.llm_name} 개선 완료</span>
                              <span className="text-green-600">{(clPageImproveResult.elapsed_ms / 1000).toFixed(1)}초 · {clPageImproveResult.char_count?.toLocaleString()}자</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold">자동 저장됨</span>
                          </div>
                          <div className="max-h-[60vh] overflow-y-auto p-5 text-[12.5px] text-gray-700 leading-relaxed
                            [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-3
                            [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:pb-1.5 [&_h2]:border-b [&_h2]:border-gray-100
                            [&_h3]:text-[12.5px] [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-3 [&_h3]:mb-1
                            [&_p]:my-1.5 [&_li]:text-[12px] [&_li]:leading-relaxed
                            [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4
                            [&_code]:text-[11px] [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
                            [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[11px] [&_pre]:overflow-x-auto [&_pre]:my-3
                            [&_strong]:text-gray-900">
                            <ReactMarkdown>{clPageImproveResult.improvements}</ReactMarkdown>
                          </div>
                          <ContentActionBar
                            content={clPageImproveResult.improvements}
                            contentType="page_improve"
                            title={`${clSelectedPage.title || "페이지"} — 개선`}
                            color={color}
                            wpConnection={wpConnection}
                            wpPublishing={wpPublishing}
                            onWpPublish={() => publishToWordPress(
                              `${clSelectedPage.title || "페이지"} — E-E-A-T 개선`,
                              clPageImproveResult.improvements
                            )}
                          />
                        </div>
                      )}

                      {clPageImproveResult && !clPageImproveResult.success && (
                        <div className="p-4 bg-red-50">
                          <p className="text-sm text-red-700">오류: {clPageImproveResult.error}</p>
                          {clPageImproveResult.details && <p className="text-xs text-red-500 mt-1">{clPageImproveResult.details?.slice(0, 200)}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 크롤링된 페이지 리스트 (페이징) ── */}
                  {clCrawledPages.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-700">
                          크롤링된 페이지 ({clCrawledPages.length}개)
                          <span className="text-xs text-gray-400 font-normal ml-2">— 클릭하여 AI 개선안 생성</span>
                        </h4>
                        <button onClick={loadCrawledPages} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> 새로고침
                        </button>
                      </div>
                      <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b text-gray-500">
                              <th className="px-3 py-2 text-left font-medium">유형</th>
                              <th className="px-3 py-2 text-left font-medium">페이지</th>
                              <th className="px-3 py-2 text-left font-medium">URL</th>
                              <th className="px-3 py-2 text-center font-medium">상태</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(clPageListExpanded ? clCrawledPages : clCrawledPages.slice(0, 8)).map((pg: any) => {
                              const isProduct = pg.url?.includes("/product/");
                              const isSelected = clSelectedPage?.id === pg.id;
                              const shortUrl = (pg.url || "").replace(/^https?:\/\/[^/]+/, "");
                              return (
                                <tr key={pg.id} onClick={() => { if (isSelected) { setClSelectedPage(null); setClPageImproveResult(null); } else { loadPageDetail(pg.id); setClPageImproveResult(null); } }}
                                  className={`border-b last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                                  <td className="px-3 py-2.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isProduct ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-700"}`}>
                                      {isProduct ? "상품" : "핵심"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 font-medium text-gray-800">{pg.title || "(제목 없음)"}</td>
                                  <td className="px-3 py-2.5 text-gray-400 font-mono text-[10px]">{shortUrl.length > 50 ? shortUrl.slice(0, 50) + "..." : shortUrl}</td>
                                  <td className="px-3 py-2.5 text-center">
                                    {isSelected ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">선택됨</span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">선택</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {clCrawledPages.length > 8 && (
                          <button onClick={() => setClPageListExpanded(!clPageListExpanded)}
                            className="w-full py-2.5 text-xs font-bold text-center border-t hover:bg-gray-50 transition-colors"
                            style={{ color }}>
                            {clPageListExpanded ? `접기 ▲` : `더보기 (${clCrawledPages.length - 8}개 더) ▼`}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl border p-6 text-center text-sm text-gray-500">
                      {analysisStatus?.brand?.site_domain
                        ? <><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /><span>크롤링된 페이지를 불러오는 중...</span></>
                        : "EEAT 분석을 먼저 실행하면 크롤링된 페이지가 여기에 표시됩니다."}
                    </div>
                  )}

                  {/* ── 이전 개선 이력 ── */}
                  {clSavedImproves.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-700">이전 개선 이력 ({clSavedImproves.length}건)</h4>
                        <button onClick={loadSavedImproves} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> 새로고침
                        </button>
                      </div>

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
                            contentType="page_improve"
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

                      <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b text-gray-500">
                              <th className="px-3 py-2 text-left font-medium">날짜</th>
                              <th className="px-3 py-2 text-left font-medium">제목</th>
                              <th className="px-3 py-2 text-left font-medium">AI</th>
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
                                <td className="px-3 py-2.5 text-gray-800 font-medium">{(item.title || "").slice(0, 40)}{(item.title || "").length > 40 ? "..." : ""}</td>
                                <td className="px-3 py-2.5">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.llm_provider === "claude" ? "#d97706" : "#10a37f" }} />
                                    {item.llm_provider === "claude" ? "Claude" : "GPT-4o"}
                                  </span>
                                </td>
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

              {/* 🎨 Gamma 디자인 패키징 — 시각적 패널 */}
              <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/80 to-blue-50/80 overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎨</span>
                    <span className="text-sm font-bold text-gray-900">Gamma 디자인 패키징</span>
                    {gammaSource && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium truncate max-w-[200px]">{gammaSource.title}</span>}
                  </div>
                  {gammaResult?.success && (
                    <div className="flex items-center gap-2">
                      <a href={gammaResult.export_url} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white border text-xs font-bold text-gray-900 hover:shadow-md">📥 {gammaExport.toUpperCase()}</a>
                      <a href={gammaResult.gamma_url} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white border text-xs font-bold text-purple-700 hover:shadow-md">👁️ 미리보기</a>
                      <a href={gammaResult.gamma_url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-purple-600 hover:underline">✏️ 편집</a>
                      <button onClick={() => setGammaResult(null)} className="text-[10px] text-gray-400 hover:text-gray-600">↻</button>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-3 grid grid-cols-4 gap-2">
                  {[
                    { key: "presentation", icon: "📊", label: "프레젠테이션", desc: "16:9 슬라이드", dim: "16x9", exp: "pptx" },
                    { key: "social", icon: "📱", label: "소셜카드", desc: "인스타 · 스토리", dim: "4x5", exp: "png" },
                    { key: "document", icon: "📄", label: "문서 / PDF", desc: "A4 리포트", dim: "a4", exp: "pdf" },
                    { key: "webpage", icon: "🌐", label: "웹페이지", desc: "호스팅 URL", dim: "fluid", exp: "pdf" },
                  ].map(fmt => {
                    const active = gammaFormat === fmt.key;
                    return (
                      <button key={fmt.key} onClick={() => { setGammaFormat(fmt.key); setGammaDimensions(fmt.dim); setGammaExport(fmt.exp); setGammaResult(null); }}
                        className={`p-2.5 rounded-lg border text-left transition-all ${active ? "bg-white border-purple-400 ring-1 ring-purple-300 shadow-sm" : "bg-white/60 border-gray-200 hover:bg-white hover:border-purple-200"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{fmt.icon}</span>
                          {active && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                        </div>
                        <p className={`text-xs font-bold mt-1 ${active ? "text-purple-700" : "text-gray-700"}`}>{fmt.label}</p>
                        <p className="text-[10px] text-gray-400">{fmt.desc}</p>
                      </button>
                    );
                  })}
                </div>
                {gammaFormat === "social" && (
                  <div className="px-4 pb-2 flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">비율:</span>
                    {[{v:"4x5",l:"4:5 인스타"},{v:"9x16",l:"9:16 스토리"},{v:"1x1",l:"1:1 정사각"}].map(d => (
                      <button key={d.v} onClick={() => setGammaDimensions(d.v)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${gammaDimensions===d.v ? "bg-purple-100 border-purple-300 text-purple-700 font-bold" : "bg-white text-gray-500"}`}>{d.l}</button>
                    ))}
                  </div>
                )}
                <div className="px-4 pb-3">
                  {gammaLoading ? (
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-600">Gamma가 디자인을 생성하고 있습니다... (30~60초)</span>
                    </div>
                  ) : gammaResult?.success ? (
                    <div className="text-xs text-green-700 flex items-center gap-1">✅ 생성 완료 — {(gammaResult.elapsed_ms/1000).toFixed(0)}초 · 크레딧 {gammaResult.credits?.deducted} 사용</div>
                  ) : gammaResult && !gammaResult.success ? (
                    <div className="text-xs text-red-500 flex items-center gap-2">⚠️ 실패: {gammaResult.message || "타임아웃"} <button onClick={() => setGammaResult(null)} className="underline">재시도</button></div>
                  ) : gammaSource ? (
                    <button onClick={async () => {
                      setGammaLoading(true); setGammaResult(null);
                      try {
                        const r = await fetch(efBase + "/geobh-gamma", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            slug: client, partner, content: gammaSource.content,
                            gamma_format: gammaFormat, gamma_dimensions: gammaDimensions,
                            export_as: gammaExport, card_split: "inputTextBreaks",
                            language: "ko", text_mode: "generate", tone: "professional, modern",
                            input_content_type: gammaSource.type || clSelectedType,
                            input_llm: gammaSource.llm,
                          }),
                        });
                        const gd = await r.json(); setGammaResult(gd); if (gd.success) loadGammaHistory();
                      } catch {}
                      setGammaLoading(false);
                    }} className="w-full py-2.5 rounded-lg text-white text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-sm transition-all">
                      🚀 &quot;{gammaSource.title.slice(0,25)}{gammaSource.title.length > 25 ? "..." : ""}&quot; → {gammaFormat === "presentation" ? "PPTX" : gammaFormat === "social" ? "PNG" : gammaFormat === "document" ? "PDF" : "웹"} 디자인 생성
                    </button>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-1">아래에서 콘텐츠를 생성하거나, 이력의 🎨 버튼을 눌러 패키징할 콘텐츠를 선택하세요</div>
                  )}
                </div>
                {/* 이미 생성된 Gamma 산출물 */}
                {gammaHistory.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-600">최근 산출물 ({gammaHistory.length}건)</span>
                      <button onClick={loadGammaHistory} className="text-[10px] text-purple-500 hover:underline">새로고침</button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {gammaHistory.slice(0, 6).map((g: any) => {
                        const fmtIcon = g.gamma_format === "presentation" ? "📊" : g.gamma_format === "social" ? "📱" : g.gamma_format === "document" ? "📄" : "🌐";
                        const date = new Date(g.created_at);
                        const dateStr = (date.getMonth()+1) + "/" + date.getDate() + " " + date.getHours() + ":" + String(date.getMinutes()).padStart(2,"0");
                        return (
                          <div key={g.id} className="bg-white rounded-lg border p-2.5 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span>{fmtIcon}</span>
                              <span className="text-[10px] font-bold text-gray-700">{g.gamma_dimensions}</span>
                              <span className="text-[10px] px-1 rounded bg-purple-50 text-purple-600">{g.export_as?.toUpperCase()}</span>
                              <span className="text-[10px] text-gray-400 ml-auto">{dateStr}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 truncate mb-1.5">{g.input_text_preview || "—"}</p>
                            <div className="flex items-center gap-1.5">
                              {g.export_url && <a href={g.export_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-2 py-1 rounded border text-[10px] font-bold text-gray-700 hover:bg-gray-50">📥 다운로드</a>}
                              {g.gamma_url && <a href={g.gamma_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-2 py-1 rounded border text-[10px] font-bold text-purple-600 hover:bg-purple-50">👁️ 보기/편집</a>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                                <button onClick={async () => {
                                  try {
                                    const { data: rows } = await supabaseClient.from("bmp_generated_contents")
                                      .select("id,title,content_type,llm_provider,body_md").eq("id", c.id).limit(1);
                                    if (rows?.[0]?.body_md) {
                                      setGammaSource({ title: rows[0].title || c.title, content: rows[0].body_md, type: rows[0].content_type, llm: rows[0].llm_provider });
                                      setGammaResult(null);
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                    }
                                  } catch {}
                                }} className="px-1.5 py-0.5 rounded border text-[10px] text-purple-600 hover:bg-purple-50" title="Gamma 패키징">
                                  🎨
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

        {/* ──── BRAND HUB TAB ──── */}
        {activeSection === "brandhub" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">🌐 Brand Hub 사이트</h3>
              <p className="text-sm text-gray-500 mb-4">
                AI 검색 최적화된 브랜드 허브 사이트입니다. GEO 데이터가 자동 반영됩니다.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <a href={`https://geocare.pages.dev/${client}/`} target="_blank" rel="noopener noreferrer"
                  className="block p-5 rounded-xl border-2 hover:shadow-lg transition group" style={{ borderColor: color }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-5 h-5" style={{ color }} />
                    <span className="font-bold" style={{ color }}>라이브 사이트</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">geocare.pages.dev/{client}/</p>
                  <span className="text-xs text-gray-400 group-hover:text-gray-600">클릭하여 새 탭에서 열기 →</span>
                </a>
                <a href={`https://nntuztaehnywdbttrajy.supabase.co/functions/v1/brandhub-serve?slug=${client}`} target="_blank" rel="noopener noreferrer"
                  className="block p-5 rounded-xl border hover:shadow-lg transition group">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-gray-600" />
                    <span className="font-bold text-gray-700">서빙 API (프리뷰)</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">brandhub-serve EF 직접 접속</p>
                  <span className="text-xs text-gray-400 group-hover:text-gray-600">클릭하여 새 탭에서 열기 →</span>
                </a>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-6">
              <h4 className="font-bold text-gray-900 mb-3">빌드 & 배포</h4>
              <p className="text-sm text-gray-500 mb-4">Brand Hub를 빌드하고 CF Pages에 배포합니다.</p>
              <div className="flex gap-3">
                <button onClick={async () => {
                  try {
                    const r = await fetch(`https://nntuztaehnywdbttrajy.supabase.co/functions/v1/brandhub-build`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ slug: client })
                    });
                    const d = await r.json();
                    alert(d.success ? `빌드 완료! ${d.files_built}파일, ${d.elapsed_sec}초` : `오류: ${d.error}`);
                  } catch (e: any) { alert("빌드 실패: " + e.message); }
                }} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: color }}>
                  🔨 빌드
                </button>
                <button onClick={async () => {
                  try {
                    const r = await fetch(`https://nntuztaehnywdbttrajy.supabase.co/functions/v1/brandhub-deploy`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ slugs: [client] })
                    });
                    const d = await r.json();
                    alert(d.success ? `배포 완료! ${d.files_count}파일, ${d.elapsed_sec}초\n${d.live_url}` : `오류: ${d.error}`);
                  } catch (e: any) { alert("배포 실패: " + e.message); }
                }} className="px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-gray-50">
                  🚀 CF Pages 배포
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-6">
              <h4 className="font-bold text-gray-900 mb-3">페이지 구성</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["홈", "제품", "FAQ", "매장", "스토리", "회사정보", "뉴스"].map((page, i) => {
                  const slugs = ["", "products", "faq", "stores", "story", "about", "news"];
                  return (
                    <a key={i} href={`https://geocare.pages.dev/${client}/${slugs[i]}/`} target="_blank" rel="noopener noreferrer"
                      className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-center text-sm font-medium transition">
                      {page}
                    </a>
                  );
                })}
                <a href={`https://geocare.pages.dev/${client}/llms.txt`} target="_blank" rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-center text-sm font-medium text-blue-700 transition">
                  llms.txt
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ──── JSON-LD 설치 TAB ──── */}
        {activeSection === "jsonld" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">🔗 JSON-LD 설치 도구</h3>
              <p className="text-sm text-gray-500 mb-4">
                고객 사이트에 JSON-LD를 설치하는 방법입니다. GTM, 서버사이드, HTML 직접 삽입 방식을 제공합니다.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl border-2 border-yellow-400 bg-yellow-50">
                  <h4 className="font-bold text-yellow-800 mb-1">방법 1: GTM 자동 삽입</h4>
                  <div className="flex gap-1 mb-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">AI 크롤러 ❌</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Google ✅</span>
                  </div>
                  <p className="text-xs text-yellow-700">GTM 커스텀 HTML 태그 하나로 전체 사이트 자동 적용. 단, AI 크롤러는 못 봄.</p>
                </div>
                <div className="p-4 rounded-xl border-2 border-green-400 bg-green-50">
                  <h4 className="font-bold text-green-800 mb-1">방법 2: 서버사이드 API</h4>
                  <div className="flex gap-1 mb-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">AI 크롤러 ✅</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Google ✅</span>
                  </div>
                  <p className="text-xs text-green-700">자체 서버에서 API 호출 후 HTML에 삽입. 자동 업데이트.</p>
                </div>
                <div className="p-4 rounded-xl border-2 border-blue-400 bg-blue-50">
                  <h4 className="font-bold text-blue-800 mb-1">방법 3: HTML 직접 삽입</h4>
                  <div className="flex gap-1 mb-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">AI 크롤러 ✅</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Google ✅</span>
                  </div>
                  <p className="text-xs text-blue-700">Cafe24 등 임대몰 head/body에 직접 삽입. 정적 태그로 AI 크롤러도 인식.</p>
                </div>
              </div>

              {/* GTM 자동감지 코드 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2">🏷️ GTM 자동 삽입 코드 (전체 사이트 한 번에 적용)</h4>
                <p className="text-xs text-gray-500 mb-2">GTM → 태그 → 새로 만들기 → 커스텀 HTML에 아래 코드 붙여넣기 → 트리거: All Pages</p>
                <div className="relative">
                  <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    <code id="gtm-auto-code">{`<script>
// GEOcare.AI — JSON-LD 자동 삽입 (GTM)
// 현재 페이지 URL을 자동 감지하여 매칭되는 JSON-LD를 삽입합니다
(function(){
  var url = encodeURIComponent(window.location.href);
  var api = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-jsonld?url=" + url;
  fetch(api)
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.success && d.data){
        var el = document.createElement("script");
        el.type = "application/ld+json";
        el.textContent = JSON.stringify(d.data);
        document.head.appendChild(el);
      }
    });
})();
</script>`}</code>
                  </pre>
                  <button onClick={() => {
                    const el = document.getElementById("gtm-auto-code");
                    if (el) { navigator.clipboard.writeText(el.textContent || ""); }
                  }} className="absolute top-2 right-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded">복사</button>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg mt-2">
                  <p className="text-xs text-yellow-800"><strong>⚠️ 참고:</strong> AI 크롤러(GPTBot, ClaudeBot)는 JavaScript를 실행하지 않으므로 이 방식으로 삽입한 JSON-LD를 볼 수 없습니다. AI 검색 인용을 원하면 서버사이드 방식을 사용하세요.</p>
                </div>
              </div>

              {/* 서버사이드 API */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2">🚀 서버사이드 API (권장)</h4>
                <p className="text-xs text-gray-500 mb-2">서버에서 API를 호출하여 JSON-LD를 가져온 후 HTML에 삽입합니다. JSON-LD 업데이트 시 자동 반영됩니다.</p>
                <div className="relative">
                  <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    <code id="api-endpoint-code">{`GET https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-jsonld?url={페이지URL}

// 응답 예시:
{
  "success": true,
  "data": [{"@context":"https://schema.org", "@type":"Organization", ...}],
  "cached": true
}`}</code>
                  </pre>
                  <button onClick={() => {
                    navigator.clipboard.writeText("https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-jsonld?url=");
                  }} className="absolute top-2 right-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded">URL 복사</button>
                </div>
              </div>

              {/* 방법 3: HTML 직접 삽입 (Cafe24 등) */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2">📌 방법 3: HTML 직접 삽입 (Cafe24/임대몰)</h4>
                <p className="text-xs text-gray-500 mb-3">
                  홈페이지·브랜드 페이지용 정적 JSON-LD를 head에 직접 삽입합니다. 서버에서 렌더링되므로 AI 크롤러(GPTBot, ClaudeBot)도 인식합니다.
                  <br />상품 상세 페이지는 Cafe24가 자동 생성하므로 별도 작업 불필요합니다.
                </p>

                {/* Step 1: JSON-LD 확인 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Step 1. 홈페이지 JSON-LD 확인</p>
                  <p className="text-xs text-blue-700 mb-2">아래 버튼을 클릭하면 이 사이트의 JSON-LD를 확인할 수 있습니다. 결과의 <code className="bg-blue-100 px-1 rounded">data</code> 값을 복사하세요.</p>
                  <a href={`https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-jsonld?url=https://${encodeURIComponent(eeatData?.analysis?.url?.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "") || client)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
                    🔍 이 사이트 JSON-LD 미리보기
                  </a>
                </div>

                {/* Step 2: 삽입 코드 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Step 2. head 태그에 삽입</p>
                  <p className="text-xs text-blue-700 mb-2">Step 1에서 확인한 JSON-LD를 아래 형식으로 head에 삽입하세요.</p>
                  <div className="relative">
                    <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      <code id="static-jsonld-code">{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "브랜드명",
      "url": "https://사이트주소"
    },
    {
      "@type": "WebSite",
      "name": "브랜드명",
      "url": "https://사이트주소",
      "publisher": {"@type": "Organization", "name": "브랜드명"}
    }
  ]
}
</script>`}</code>
                    </pre>
                    <button onClick={() => {
                      const el = document.getElementById("static-jsonld-code");
                      if (el) { navigator.clipboard.writeText(el.textContent || ""); }
                    }} className="absolute top-2 right-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded">복사</button>
                  </div>
                </div>

                {/* Cafe24 경로 안내 */}
                <div className="bg-gray-50 border rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">☕ Cafe24 삽입 경로</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><strong>방법 A:</strong> 관리자 → 쇼핑몰 설정 → 기본 설정 → 검색엔진최적화(SEO) → 고급 설정 → Head 태그 삽입</p>
                    <p><strong>방법 B:</strong> 관리자 → 디자인 → 스마트디자인 편집 → layout.html → &lt;head&gt; 영역에 삽입</p>
                  </div>
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    <strong>💡 참고:</strong> 상품 상세 페이지의 Product JSON-LD는 Cafe24가 자동 생성합니다 (name, image, brand, offers 포함). 별도 작업이 필요하지 않습니다.
                  </div>
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    <strong>🔄 향후:</strong> Cafe24 ScriptTags API 연동 시 수동 삽입 없이 자동 설치·업데이트가 가능합니다.
                  </div>
                </div>
              </div>

              {/* 상세 가이드 링크 */}
              <div className="flex gap-3">
                <a href="/jsonld-tools" className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: color }}>
                  📋 설치 가이드 상세 보기
                </a>
                <a href={`https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-jsonld-tools?action=pages&site=${encodeURIComponent(eeatData?.analysis?.url?.replace(/https?:\/\/(www\.)?/, "").split("/")[0] || client)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-gray-50">
                  🔍 이 사이트 JSON-LD 목록
                </a>
              </div>
            </div>

            {/* 비교표 */}
            <div className="bg-white rounded-2xl border p-6">
              <h4 className="font-bold text-gray-900 mb-3">📊 방법별 비교</h4>
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 text-xs text-gray-500">항목</th><th className="text-left py-2 text-xs text-gray-500">GTM</th><th className="text-left py-2 text-xs text-gray-500">서버사이드 API</th><th className="text-left py-2 text-xs text-gray-500">HTML 직접 삽입</th></tr></thead>
                <tbody>
                  <tr className="border-b border-gray-100"><td className="py-2">AI 크롤러</td><td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">❌</span></td><td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">✅</span></td><td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">✅ 정적</span></td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2">Google</td><td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">✅</span></td><td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">✅</span></td><td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">✅</span></td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2">개발 필요</td><td>없음</td><td>중간</td><td>없음</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2">자동 업데이트</td><td>수동</td><td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">자동</span></td><td>수동 (향후 API 자동)</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2">Cafe24 지원</td><td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">✅</span></td><td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">❌</span></td><td><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">✅ 권장</span></td></tr>
                  <tr><td className="py-2">추천 대상</td><td>마케터</td><td>자체 서버 운영</td><td>임대몰 (Cafe24 등)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ──── LIFT TRACKER TAB ──── */}
        {activeSection === "lift" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">⚡ LIFT Tracker 설치 도구</h3>
              <p className="text-sm text-gray-500 mb-4">
                고객 사이트에 LIFT Tracker(기여분석 수집 태그)를 설치하는 방법입니다. GTM 방식과 서버사이드 API 방식을 제공합니다.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl border-2 border-blue-400 bg-blue-50">
                  <h4 className="font-bold text-blue-800 mb-1">방법 1: GTM 자동 삽입 (권장) ✅</h4>
                  <p className="text-xs text-blue-700">GTM 컨테이너에 LIFT 수집 태그를 원클릭 자동 설치. 고객사의 GTM 편집 권한만 있으면 됩니다.</p>
                </div>
                <div className="p-4 rounded-xl border-2 border-gray-300 bg-gray-50">
                  <h4 className="font-bold text-gray-800 mb-1">방법 2: GTM 수동 삽입</h4>
                  <p className="text-xs text-gray-600">GTM 권한을 주기 어려운 경우, 고객사가 직접 태그를 추가합니다.</p>
                </div>
              </div>

              {/* GTM 자동 삽입 안내 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2">🏷️ 방법 1: GTM 자동 삽입 (권장)</h4>
                <p className="text-xs text-gray-500 mb-3">GTM 컨테이너에 LIFT 수집 태그를 원클릭 자동 설치합니다.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
                  <p className="font-semibold text-blue-900 text-sm mb-2">고객이 해야 할 일:</p>
                  <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Google Tag Manager (tagmanager.google.com) 접속</li>
                    <li>해당 사이트의 GTM 컨테이너 선택</li>
                    <li>관리자 → 컨테이너 사용자 관리 → + (추가)</li>
                    <li>이메일: <code className="bg-blue-100 px-1 rounded">tagman@bizspring.co.kr</code></li>
                    <li>권한: &quot;게시&quot; 선택 후 저장</li>
                    <li>비즈스프링에 완료 회신</li>
                  </ol>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                  <p className="font-semibold text-green-900 text-sm mb-2">비즈스프링이 자동으로 하는 일:</p>
                  <ul className="text-xs text-green-800 space-y-1 list-disc list-inside">
                    <li>GTM API로 LIFT Tracker 태그 자동 배포</li>
                    <li>고객사 추가 작업 없음</li>
                    <li>기존 GA4 등 다른 태그에 영향 없음</li>
                  </ul>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <p className="font-semibold text-gray-700 text-xs mb-1">수집 범위</p>
                  <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside">
                    <li>UTM 파라미터 또는 외부 유입이 있는 트래픽만 수집 (전체의 10~20%)</li>
                    <li>페이로드 ~200바이트 — 사이트 성능 영향 없음</li>
                    <li>GA4와 병렬 전송 (간섭 없음)</li>
                  </ul>
                </div>
              </div>

              {/* GTM 수동 삽입 코드 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2">🔧 방법 2: GTM 수동 삽입</h4>
                <p className="text-xs text-gray-500 mb-2">GTM → 태그 → 새로 만들기 → 커스텀 HTML에 아래 코드 붙여넣기 → 트리거: All Pages</p>
                <div className="relative">
                  <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    <code id="lift-gtm-code">{`<script>
(function(){
  var TC = '고객사_테넌트코드';
  var EP = 'https://ihzttwgqahhzlrqozleh.supabase.co/functions/v1/lift-collect';
  var loc = window.location;
  var ref = document.referrer;
  var hasUtm = loc.search.indexOf('utm_') > -1;
  var hasRef = ref && ref.indexOf(loc.hostname) === -1;
  var sid = sessionStorage.getItem('_lift_sid');
  if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('_lift_sid', sid); }
  if (hasUtm || hasRef) {
    var p = new URLSearchParams(loc.search);
    _send({tc:TC,et:'pageview',url:loc.href,ref:ref,
      us:p.get('utm_source'),um:p.get('utm_medium'),
      uc:p.get('utm_campaign'),ut:p.get('utm_term'),
      ux:p.get('utm_content'),sid:sid,ts:Date.now()});
  }
  window._lift = function(name, value) {
    _send({tc:TC,et:'conversion',en:name,ev:value,
      url:loc.href,ref:ref,sid:sid,ts:Date.now()});
  };
  function _send(d) { try { navigator.sendBeacon(EP, JSON.stringify(d)); } catch(e) {} }
})();
</script>`}</code>
                  </pre>
                  <button onClick={() => {
                    const el = document.getElementById("lift-gtm-code");
                    if (el) { navigator.clipboard.writeText(el.textContent || ""); }
                  }} className="absolute top-2 right-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded">복사</button>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg mt-2">
                  <p className="text-xs text-yellow-800"><strong>⚠️ 참고:</strong> <code className="bg-yellow-100 px-1 rounded">고객사_테넌트코드</code> 부분을 비즈스프링에서 발급한 코드로 교체해주세요.</p>
                </div>
              </div>

              {/* 전환 수집 코드 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2">🎯 전환 수집 (구매/회원가입 등)</h4>
                <p className="text-xs text-gray-500 mb-2">사이트의 전환 완료 페이지에서 아래 코드를 호출합니다. GTM 트리거 또는 사이트 코드에서 직접 호출 가능합니다.</p>
                <div className="relative">
                  <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    <code id="lift-conversion-code">{`// 구매 완료
_lift('purchase', 59000);

// 회원가입
_lift('signup');

// 상담 예약
_lift('consultation');

// 장바구니 담기
_lift('add_to_cart', 29000);`}</code>
                  </pre>
                  <button onClick={() => {
                    const el = document.getElementById("lift-conversion-code");
                    if (el) { navigator.clipboard.writeText(el.textContent || ""); }
                  }} className="absolute top-2 right-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded">복사</button>
                </div>
              </div>

              {/* 서버사이드 API */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2">🚀 서버사이드 API (향후)</h4>
                <p className="text-xs text-gray-500 mb-2">서버에서 직접 LIFT 수집 API를 호출하여 데이터를 전송합니다.</p>
                <div className="relative">
                  <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    <code id="lift-api-code">{`POST https://ihzttwgqahhzlrqozleh.supabase.co/functions/v1/lift-collect

Content-Type: application/json

{
  "tc": "고객사_테넌트코드",
  "et": "pageview",
  "url": "https://고객사.com/product/123",
  "us": "google",
  "um": "cpc",
  "uc": "spring_sale",
  "sid": "세션ID",
  "ts": 1711234567890
}

응답: HTTP 204 (성공) / HTTP 400 (필수 필드 누락)`}</code>
                  </pre>
                  <button onClick={() => {
                    navigator.clipboard.writeText("https://ihzttwgqahhzlrqozleh.supabase.co/functions/v1/lift-collect");
                  }} className="absolute top-2 right-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded">URL 복사</button>
                </div>
              </div>
            </div>

            {/* 온보딩 흐름 */}
            <div className="bg-white rounded-2xl border p-6">
              <h4 className="font-bold text-gray-900 mb-3">📌 고객 온보딩 전체 흐름</h4>
              <div className="space-y-3">
                {[
                  { step: "①", text: "비즈스프링이 테넌트 코드 발급", sub: "예: motive_clientA" },
                  { step: "②", text: "고객사가 tagman@bizspring.co.kr에 GTM 편집 권한 부여", sub: "" },
                  { step: "③", text: "비즈스프링이 GTM API로 LIFT 태그 자동 배포", sub: "1분 이내" },
                  { step: "④", text: "고객사 사이트에 UTM 파라미터로 접속 시 자동 수집 시작", sub: "" },
                  { step: "⑤", text: "전환 수집이 필요하면 _lift() 코드 추가", sub: "구매완료 페이지 등" },
                  { step: "⑥", text: "LIFT 대시보드에서 기여분석 결과 확인", sub: "Phase 2" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <span className="text-lg font-bold" style={{ color }}>{item.step}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.text}</p>
                      {item.sub && <p className="text-xs text-gray-500">{item.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl border p-6">
              <h4 className="font-bold text-gray-900 mb-3">❓ FAQ</h4>
              <div className="space-y-3">
                {[
                  { q: "기존 GA4 태그에 영향이 있나요?", a: "없습니다. LIFT Tracker는 GA4와 완전히 독립적으로 작동합니다." },
                  { q: "사이트 속도에 영향이 있나요?", a: "페이로드가 ~200바이트이고, sendBeacon API를 사용하므로 페이지 로딩에 영향 없습니다." },
                  { q: "어떤 데이터를 수집하나요?", a: "UTM 파라미터, 레퍼러, 페이지 URL, 세션 ID만 수집합니다. 개인정보(이름, 이메일 등)는 수집하지 않으며, IP 주소는 해시 처리 후 원본을 삭제합니다." },
                  { q: "모든 페이지뷰를 수집하나요?", a: "아닙니다. UTM 파라미터가 있거나 외부 사이트에서 유입된 경우에만 수집합니다 (전체 트래픽의 10~20%)." },
                ].map((faq, i) => (
                  <div key={i} className="p-3 rounded-lg border border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Q: {faq.q}</p>
                    <p className="text-xs text-gray-600">A: {faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ──── A/B TEST TAB ──── */}
        {activeSection === "abtest" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5" style={{ color }} /> GEO A/B 비교 분석
              </h3>
              <p className="text-sm text-gray-500 mt-1">고객 원본 사이트 vs GEOcare Brand Hub — AI 검색 인용 준비도 비교</p>
            </div>

            {abTestsLoading && (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /><span className="ml-2 text-sm text-gray-500">데이터 로딩...</span></div>
            )}

            {!abTestsLoading && abSelectedTest && (() => {
              const t = abSelectedTest;
              const origUrl = t.original_url || analysisStatus?.brand?.site_domain || "";
              const hubUrl = t.hub_url || (analysisStatus?.brand?.brandhub_slug ? "https://geocare.pages.dev/" + analysisStatus.brand.brandhub_slug + "/" : null);
              const origDomain = origUrl.replace(/https?:\/\//, "").replace(/\/$/, "");
              const hubDomain = hubUrl ? hubUrl.replace(/https?:\/\//, "").replace(/\/$/, "") : "geocare.pages.dev/{slug}/";
              const origScore = t.score_a_baseline ?? abOriginalJsonld?.url_analysis?.total_score ?? "—";
              const hubScore = t.score_b_result ?? t.variant_b?.expected_score ?? "—";
              const diff = typeof origScore === "number" && typeof hubScore === "number" ? hubScore - origScore : null;

              const comparisonPrompt = `다음 두 웹사이트의 AI 검색 최적화(GEO) 상태를 비교 분석해줘.

사이트 A (고객 원본): ${origUrl}
사이트 B (GEOcare Brand Hub): ${hubUrl || "https://geocare.pages.dev/" + (analysisStatus?.brand?.brandhub_slug || "example") + "/"}

아래 7개 항목을 각각 100점 만점으로 평가하고, 표 형식으로 비교해줘:
1. JSON-LD 구조화 데이터 (가중치 20%) — Schema.org 타입 수, 구현 품질
2. 메타 태그 품질 (가중치 15%) — title, description, OG 태그, canonical
3. FAQ 스키마 (가중치 15%) — FAQPage 마크업 유무, Q&A 구조화
4. 콘텐츠 깊이 (가중치 15%) — 페이지 수, 정보량, 시맨틱 HTML
5. 로딩 속도 (가중치 10%) — 응답 시간, CDN, 최적화
6. llms.txt / AI 가이드 (가중치 10%) — llms.txt 유무, robots.txt AI 크롤러 허용
7. AI 인용 가능성 (가중치 15%) — 종합적으로 AI가 인용하기 좋은 구조인지

각 항목별 점수와 함께, 전체 가중 평균 종합 점수도 계산해줘.
마지막에 "어느 사이트가 AI 검색 엔진(ChatGPT, Perplexity, Google AI Overview)에 더 잘 인용될까?"에 대한 결론을 내려줘.`;

              return (
                <div className="space-y-5">
                  {/* ── 비교 분석 프롬프트 (상단) ── */}
                  <div className="bg-gray-900 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-200">📋 GEO 비교 분석 프롬프트</span>
                        <span className="text-xs text-gray-500">— 복사 후 ChatGPT / Perplexity / Claude / Gemini에 질의하세요</span>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(comparisonPrompt); setAbCopied(99); setTimeout(() => setAbCopied(false), 2000); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
                      >
                        {abCopied === 99 ? <><CheckCircle className="w-3.5 h-3.5" /> 복사 완료!</> : <><FileText className="w-3.5 h-3.5" /> 프롬프트 복사</>}
                      </button>
                    </div>
                    <pre className="px-4 py-3 text-xs text-green-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">{comparisonPrompt}</pre>
                  </div>

                  {/* ── URL 비교 헤더 ── */}
                  <div className="grid grid-cols-2 gap-4">
                    <a href={origUrl} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl border-2 border-red-200 bg-red-50/50 hover:border-red-300 transition-all group">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Site A — 고객 원본 사이트</span>
                        <ExternalLink className="w-3 h-3 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-sm font-mono text-red-700 truncate">{origDomain}</div>
                    </a>
                    <a href={hubUrl || "#"} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl border-2 border-green-200 bg-green-50/50 hover:border-green-300 transition-all group">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Site B — GEOcare Brand Hub</span>
                        <ExternalLink className="w-3 h-3 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-sm font-mono text-green-700 truncate">{hubDomain}</div>
                    </a>
                  </div>

                  {/* ── 종합 점수 비교 ── */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-6 text-center border border-red-100 shadow-sm">
                      <div className="text-4xl font-black font-mono" style={{ color: typeof origScore === "number" && origScore < 40 ? "#ef4444" : "#f59e0b" }}>{origScore}</div>
                      <div className="text-xs font-bold text-red-600 mt-1 uppercase">원본 GEO 점수</div>
                      {abOriginalJsonld?.data && (
                        <div className="flex flex-wrap justify-center gap-1 mt-2">
                          {(Array.isArray(abOriginalJsonld.data) ? abOriginalJsonld.data : (abOriginalJsonld.data?.["@graph"] || [])).map((s: any, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-500 border border-red-100">{s["@type"]}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-3xl font-black text-gray-300">VS</div>
                      {diff != null && <div className="text-lg font-bold mt-1" style={{ color }}>+{diff}점</div>}
                    </div>
                    <div className="bg-white rounded-xl p-6 text-center border border-green-100 shadow-sm">
                      <div className="text-4xl font-black font-mono text-green-600">{hubScore}</div>
                      <div className="text-xs font-bold text-green-700 mt-1 uppercase">Brand Hub GEO 점수{!t.score_b_result && t.variant_b?.expected_score ? " (예상)" : ""}</div>
                      {abHubJsonld?.data && (
                        <div className="flex flex-wrap justify-center gap-1 mt-2">
                          {(Array.isArray(abHubJsonld.data) ? abHubJsonld.data : (abHubJsonld.data?.["@graph"] || [])).map((s: any, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-600 border border-green-100">{s["@type"]}</span>
                          ))}
                        </div>
                      )}
                      {!abHubJsonld?.data && t.variant_b?.schemas && (
                        <div className="flex flex-wrap justify-center gap-1 mt-2">
                          {t.variant_b.schemas.map((s: string, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-600 border border-green-100">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── 항목별 비교 (위 프롬프트로 생성한 비교표) ── */}
                  <div className="bg-white rounded-xl border p-5">
                    <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" style={{ color }} /> 항목별 비교
                    </h4>
                    <p className="text-xs text-gray-400 mb-4">위 프롬프트를 LLM에 질의하면 아래와 유사한 비교 결과를 받을 수 있습니다</p>
                    <div className="flex gap-5 mb-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />{origDomain}</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />{hubDomain}</span>
                    </div>
                    {[
                      { name: "JSON-LD 구조화", w: 20, a: 20, b: 85, na: "기본 스키마만 존재", nb: "다중 스키마 (Restaurant, FAQPage, Product 등)" },
                      { name: "메타 태그", w: 15, a: 25, b: 80, na: "기본 OG 태그", nb: "페이지별 최적화 title/description/canonical" },
                      { name: "FAQ 스키마", w: 15, a: 15, b: 90, na: "FAQ 미구현", nb: "FAQPage 스키마 + 아코디언 UI" },
                      { name: "콘텐츠 깊이", w: 15, a: 30, b: 85, na: "제한된 정보", nb: "다중 페이지, 풍부한 구조화 콘텐츠" },
                      { name: "로딩 속도", w: 10, a: 45, b: 85, na: "일반 속도", nb: "CDN 엣지 서빙, 0.1초대" },
                      { name: "llms.txt", w: 10, a: 0, b: 95, na: "미존재", nb: "llms.txt + AI 크롤러 허용 정책" },
                      { name: "AI 인용 가능성", w: 15, a: 25, b: 90, na: "구조화 데이터 부재", nb: "시맨틱 HTML + AI 가이드 완비" },
                    ].map((item, idx) => (
                      <div key={idx} className="mb-4 pb-4 border-b border-gray-50 last:border-0 last:mb-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                          <span className="text-xs text-gray-400">가중치 {item.w}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-gray-400 truncate mr-2">{item.na}</span><span className="font-mono font-bold text-red-500">{item.a}</span></div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-red-400 rounded-full" style={{ width: item.a + "%" }} /></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-gray-400 truncate mr-2">{item.nb}</span><span className="font-mono font-bold text-green-600">{item.b}</span></div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: item.b + "%" }} /></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── 추가 LLM 질의 ── */}
                  {(() => {
                    const brandName = (eeatData?.analysis as any)?.brand_name || analysisStatus?.brand?.brand_name || origDomain;
                    const hubExample = hubUrl || "https://geocare.pages.dev/" + (analysisStatus?.brand?.brandhub_slug || "example") + "/";
                    const extraPrompts = [
                      {
                        label: "🔍 브랜드 인지도 비교",
                        text: "\"" + brandName + "\" 브랜드에 대해 알려줘. 다음 두 사이트를 참고해서 정보의 품질을 비교해줘.\n- 원본: " + origUrl + "\n- Brand Hub: " + hubExample,
                      },
                      {
                        label: "❓ FAQ 인용 테스트",
                        text: "\"" + brandName + "\"에 대해 자주 묻는 질문 5가지와 답변을 알려줘. 다음 두 사이트를 참고해줘:\n- 원본: " + origUrl + "\n- Brand Hub: " + hubExample + "\n어느 사이트의 FAQ가 더 잘 구조화되어 있는지 평가해줘.",
                      },
                      {
                        label: "🤖 E-E-A-T 종합 진단",
                        text: "다음 두 사이트의 E-E-A-T(경험, 전문성, 권위, 신뢰) 수준을 비교해줘:\n- 원본: " + origUrl + "\n- Brand Hub: " + hubExample + "\n각 항목별 점수(100점)와 개선 방향을 제시해줘.",
                      },
                    ];
                    return (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-gray-900">추가 LLM 질의 프롬프트</h4>
                        {extraPrompts.map((p, idx) => (
                          <div key={idx} className="bg-gray-50 border rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-100">
                              <span className="text-sm">{p.label}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(p.text); setAbCopied(idx); setTimeout(() => setAbCopied(false), 2000); }}
                                className="flex items-center gap-1 px-3 py-1 rounded text-xs bg-white border hover:bg-gray-50 transition-colors"
                                style={abCopied === idx ? { color: "#10b981", borderColor: "#10b981" } : {}}
                              >
                                {abCopied === idx ? <><CheckCircle className="w-3 h-3" /> 복사됨</> : <><FileText className="w-3 h-3" /> 복사</>}
                              </button>
                            </div>
                            <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line select-all cursor-text">{p.text}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* ── 링크 버튼 ── */}
                  <div className="grid grid-cols-2 gap-3">
                    <a href={origUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium text-red-600 border-red-200 hover:bg-red-50 transition-all">
                      <ExternalLink className="w-4 h-4" /> 원본 사이트 방문
                    </a>
                    <a href={hubUrl || "#"} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all"
                      style={{ background: color }}>
                      <ExternalLink className="w-4 h-4" /> Brand Hub 사이트 방문
                    </a>
                  </div>

                  {/* ── 결론 ── */}
                  {diff != null && (
                    <div className="rounded-xl p-5 text-center" style={{ background: color + "10", border: "1px solid " + color + "30" }}>
                      <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>🏆 분석 결론</div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        GEOcare Brand Hub는 원본 대비 <strong className="text-lg" style={{ color }}>+{diff}점</strong> 높은 GEO 점수를 기록했습니다.
                        AI 검색 엔진(ChatGPT, Perplexity, Google AI Overview)이 이 브랜드를 인용할 확률이 크게 향상됩니다.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* No Tests */}
            {!abTestsLoading && abTests.length === 0 && (
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                  <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-gray-700 mb-2">GEO A/B 비교를 시작하세요</h4>
                  <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
                    고객의 현재 사이트와 GEOcare Brand Hub(geocare.pages.dev)로 구축한 최적화 사이트를 비교합니다.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100"><div className="text-2xl mb-2">1️⃣</div><div className="text-sm font-bold text-gray-700">원본 사이트 분석</div><div className="text-xs text-gray-500 mt-1">현재 GEO 점수 측정</div></div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100"><div className="text-2xl mb-2">2️⃣</div><div className="text-sm font-bold text-gray-700">Brand Hub 구축</div><div className="text-xs text-gray-500 mt-1">geocare.pages.dev에 최적화 사이트</div></div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100"><div className="text-2xl mb-2">3️⃣</div><div className="text-sm font-bold text-gray-700">비교 제시</div><div className="text-xs text-gray-500 mt-1">프롬프트 복사 → LLM 질의 → 영업 활용</div></div>
                </div>
              </div>
            )}
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
      </div>{/* z-10 */}
    </div>
  );
}
