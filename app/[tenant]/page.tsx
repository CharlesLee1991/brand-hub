"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
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
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Star,
  MessageSquare,
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

/* ────── Main Page Component ────── */
export default function TenantPage() {
  const { tenant } = useParams() as { tenant: string };

  // Data states
  const [hubConfig, setHubConfig] = useState<HubConfig | null>(null);
  const [eeatData, setEeatData] = useState<{
    analysis: EEATAnalysis;
    page_scores: PageScore[];
    compliance: Compliance | null;
    client_analyses: { slug: string; url: string; industry: string; score: number; grade: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"overview" | "analysis" | "services" | "chat">("overview");

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Page scores expand
  const [showAllPages, setShowAllPages] = useState(false);

  const BAWEE_EF = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";

  /* ── Load hub config from geobh-data ── */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Hub config
        const configRes = await fetch(`${BAWEE_EF}/geobh-data?slug=${tenant}`);
        const configData = await configRes.json();
        if (configData.success !== false && configData.config) {
          setHubConfig(configData.config);
        }

        // 2. EEAT data (try by partner slug mapping)
        const slugMap: Record<string, string> = {
          hahmshout: "samsung-hospital",
          mprd: "taxtok",
          frameout: "yedaham",
          mplanit: "shoppingnt",
        };
        const eeatSlug = slugMap[tenant];
        if (eeatSlug) {
          const eeatRes = await fetch(`${BAWEE_EF}/geobh-eeat?slug=${eeatSlug}`);
          const eeat = await eeatRes.json();
          if (eeat.success) {
            setEeatData(eeat);
          }
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenant]);

  /* ── Chat scroll ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        body: JSON.stringify({ tenant_code: tenant, query: query.trim(), include_sources: true }),
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

  /* ── Loading state ── */
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
    { key: "overview", label: "개요", icon: TrendingUp },
    { key: "analysis", label: "EEAT 분석", icon: Shield },
    { key: "services", label: "서비스", icon: Award },
    { key: "chat", label: "AI 어시스턴트", icon: MessageSquare },
  ] as const;

  const suggestedQuestions =
    tenant === "hahmshout"
      ? [
          "함샤우트글로벌은 어떤 회사인가요?",
          "삼성서울병원 EEAT 점수는?",
          "PR-GEO 통합 서비스가 뭔가요?",
          "GEO 솔루션 상세 설명해줘",
        ]
      : ["어떤 서비스를 제공하나요?", "비용은 어떻게 되나요?", "포트폴리오가 있나요?"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ════ Header ════ */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{hubConfig.brand_name}</h1>
            <p className="text-xs text-gray-500 truncate">{hubConfig.brand_description?.slice(0, 60)}...</p>
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
        {/* ──── OVERVIEW TAB ──── */}
        {activeSection === "overview" && (
          <div className="space-y-8">
            {/* Hero */}
            <section
              className="rounded-2xl p-8 text-white"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
            >
              <h2 className="text-2xl font-bold mb-2">{hubConfig.brand_name}</h2>
              <p className="text-white/80 leading-relaxed">{hubConfig.brand_description}</p>
            </section>

            {/* EEAT Summary Cards */}
            {sc && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">고객사 E-E-A-T 분석 현황</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {eeatData?.client_analyses?.map((client) => (
                    <div
                      key={client.slug}
                      className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setActiveSection("analysis")}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-900">
                            {client.url.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">{client.industry}</p>
                        </div>
                        <div
                          className="flex items-center justify-center w-12 h-12 rounded-xl text-white font-black text-xl"
                          style={{ backgroundColor: client.grade === "A" ? "#10b981" : "#3b82f6" }}
                        >
                          {client.grade}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${client.score}%`,
                              backgroundColor: client.grade === "A" ? "#10b981" : "#3b82f6",
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-700">{client.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quick Stats */}
            {sc && eeatData?.compliance && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "분석 페이지",
                    value: `${eeatData.page_scores.length}개`,
                    icon: FileText,
                    iconColor: "#6366f1",
                  },
                  { label: "EEAT 등급", value: sc.overall_grade, icon: Award, iconColor: color },
                  {
                    label: "컴플라이언스",
                    value: `위반 ${eeatData.compliance.total_items}건`,
                    icon: Shield,
                    iconColor: eeatData.compliance.high_risk > 0 ? "#ef4444" : "#10b981",
                  },
                  { label: "업종", value: eeatData.analysis.industry, icon: Users, iconColor: "#8b5cf6" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl border p-4 text-center">
                    <stat.icon className="w-6 h-6 mx-auto mb-2" style={{ color: stat.iconColor }} />
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──── ANALYSIS TAB ──── */}
        {activeSection === "analysis" && sc && (
          <div className="space-y-8">
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

            {/* Compliance */}
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
                <p className="text-sm text-gray-500">
                  총 {eeatData.compliance.total_items}건의 컴플라이언스 항목이 검출되었습니다. 상세 내용은 AI 어시스턴트에게 질문하세요.
                </p>
              </section>
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
    </div>
  );
}
