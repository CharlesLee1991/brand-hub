import { Metadata } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nntuztaehnywdbttrajy.supabase.co";

interface ReportData {
  client: { client_name: string; client_url: string; client_industry: string; partner_slug: string };
  bml: { bml_level: number; bml_score: number; score_breakdown: Record<string, number>; previous_level: number | null; level_change: string; score_change: number; measured_at: string; checklist_status: any };
  actions: Array<{ action_item: string; action_category: string; estimated_score_gain: number; priority: string; current_level: number; target_level: number }>;
  som: { overall: string; total: number };
  benchmark: { total_score: number; avg_brand_alignment: number; avg_answer_completeness: number; avg_ai_readability: number; avg_search_discoverability: number; avg_conversion_power: number } | null;
  eeat: { experience_score: number; expertise_score: number; authoritativeness_score: number; trustworthiness_score: number; overall_score: number } | null;
  competitors: Array<{ name: string; count: number }>;
  report_type: string;
}

const BML_NAMES: Record<number, string> = { 1: "Invisible", 2: "Discoverable", 3: "Recognized", 4: "Authoritative", 5: "Dominant" };
const BML_COLORS: Record<number, string> = { 1: "#9E9E9E", 2: "#2563EB", 3: "#059669", 4: "#7C3AED", 5: "#EA580C" };
const CAT_LABELS: Record<string, string> = { ai_search: "AI 검색 노출", structured_data: "구조화 데이터", web_presence: "웹 존재감", content_eeat: "콘텐츠·E-E-A-T", reputation: "평판 관리" };
const CAT_MAX: Record<string, number> = { ai_search: 25, structured_data: 20, web_presence: 20, content_eeat: 20, reputation: 15 };
const CAT_ICONS: Record<string, string> = { content_eeat: "📝", reputation: "⭐", ai_search: "🔍", structured_data: "📐", web_presence: "🌐" };

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return { title: `GEO Insight Report — ${params.slug}`, description: "AI 검색 건강 리포트 by GEOcare.AI" };
}

async function fetchReport(slug: string, type: string): Promise<ReportData | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/geo-insight-report?client_slug=${slug}&type=${type}&format=json`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function ReportPage({ params, searchParams }: { params: { slug: string }; searchParams: { type?: string } }) {
  const type = searchParams.type || "monthly";
  const data = await fetchReport(params.slug, type);

  if (!data || !data.client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">리포트를 찾을 수 없습니다</h1>
          <p className="text-gray-500 text-sm">유효하지 않은 링크이거나 아직 리포트가 생성되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  const { client, bml, actions, som, benchmark, eeat, competitors } = data;
  const levelColor = BML_COLORS[bml.bml_level] || "#999";
  const levelName = BML_NAMES[bml.bml_level] || "";
  const changeIcon = bml.level_change === "up" ? "↑" : bml.level_change === "down" ? "↓" : "→";
  const isTrialGrad = type === "trial_graduation";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs text-gray-400 tracking-wider mb-1">GEOcare.AI</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {isTrialGrad ? "Trial 졸업 리포트" : "월간 GEO Insight Report"}
          </h1>
          <p className="text-sm text-gray-500">{client.client_name} · {client.client_url}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date().toISOString().split("T")[0]} · {client.client_industry || ""}</p>
        </div>

        {/* S1: BML */}
        <section className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <h2 className="text-base font-semibold mb-4">1. Brand Maturity Level</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0" style={{ background: levelColor }}>
              {bml.bml_level}
            </div>
            <div>
              <div className="text-lg font-bold">BML-{bml.bml_level} {levelName}</div>
              <div className="text-sm text-gray-500">{bml.bml_score} / 100점</div>
              <div className="text-xs" style={{ color: bml.level_change === "up" ? "#059669" : bml.level_change === "down" ? "#DC2626" : "#9CA3AF" }}>
                {changeIcon} {bml.previous_level ? `BML-${bml.previous_level} → BML-${bml.bml_level}` : "최초 측정"} ({bml.score_change > 0 ? "+" : ""}{bml.score_change}점)
              </div>
            </div>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full mb-4">
            <div className="h-full rounded-full transition-all" style={{ width: `${bml.bml_score}%`, background: levelColor }} />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(bml.score_breakdown).filter(([k]) => k !== "som_pct").map(([k, v]) => (
              <div key={k} className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-800">{v}<span className="text-xs text-gray-400">/{CAT_MAX[k]}</span></div>
                <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{CAT_LABELS[k]}</div>
              </div>
            ))}
          </div>
        </section>

        {/* S2: 5 KPI */}
        {benchmark && (
          <section className="bg-white rounded-xl p-6 mb-4 shadow-sm">
            <h2 className="text-base font-semibold mb-4">2. 5대 KPI</h2>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "브랜드 정합성", en: "Brand Alignment", value: benchmark.avg_brand_alignment },
                { label: "답변 완결성", en: "Completeness", value: benchmark.avg_answer_completeness },
                { label: "AI 가독성", en: "Readability", value: benchmark.avg_ai_readability },
                { label: "검색 발견성", en: "Discoverability", value: benchmark.avg_search_discoverability },
                { label: "전환 준비도", en: "Conversion", value: benchmark.avg_conversion_power },
              ].map((kpi) => (
                <div key={kpi.en} className="text-center p-3">
                  <div className="text-xl font-bold text-gray-800">{kpi.value ? Number(kpi.value).toFixed(1) : "-"}</div>
                  <div className="text-[10px] text-gray-400">/5.0</div>
                  <div className="text-[11px] text-gray-600 mt-1">{kpi.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* S3: SoM */}
        <section className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <h2 className="text-base font-semibold mb-4">3. SoM (Share of Mind)</h2>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold" style={{ color: levelColor }}>{som.overall}%</div>
            <div className="text-xs text-gray-400">전체 AI 검색 점유율 ({som.total}개 질문)</div>
          </div>
        </section>

        {/* S4: Competitors */}
        {competitors.length > 0 && (
          <section className="bg-white rounded-xl p-6 mb-4 shadow-sm">
            <h2 className="text-base font-semibold mb-4">4. 경쟁사 비교</h2>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50"><th className="p-2 text-left font-medium">경쟁사</th><th className="p-2 text-center font-medium">인용 횟수</th></tr></thead>
              <tbody>
                {competitors.slice(0, 8).map((c, i) => (
                  <tr key={i} className="border-t border-gray-100"><td className="p-2">{c.name}</td><td className="p-2 text-center">{c.count}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* S5: Tech */}
        {benchmark && (
          <section className="bg-white rounded-xl p-6 mb-4 shadow-sm">
            <h2 className="text-base font-semibold mb-4">5. 사이트 기술 감사</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg"><div className="text-xs text-gray-500">종합 점수</div><div className="text-2xl font-bold">{Number(benchmark.total_score).toFixed(1)}</div></div>
              <div className="p-3 bg-gray-50 rounded-lg"><div className="text-xs text-gray-500">AI Readability</div><div className="text-2xl font-bold">{Number(benchmark.avg_ai_readability).toFixed(1)}<span className="text-xs text-gray-400">/5.0</span></div></div>
            </div>
          </section>
        )}

        {/* S6: EEAT */}
        {eeat && (
          <section className="bg-white rounded-xl p-6 mb-4 shadow-sm">
            <h2 className="text-base font-semibold mb-4">6. E-E-A-T 분석</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "경험", value: eeat.experience_score },
                { label: "전문성", value: eeat.expertise_score },
                { label: "권위성", value: eeat.authoritativeness_score },
                { label: "신뢰성", value: eeat.trustworthiness_score },
              ].map((e) => (
                <div key={e.label} className="text-center p-3">
                  <div className="text-2xl font-bold">{e.value || "-"}</div>
                  <div className="text-[10px] text-gray-400">/100</div>
                  <div className="text-xs mt-1">{e.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* S7: Actions */}
        {actions && actions.length > 0 && (
          <section className="bg-white rounded-xl p-6 mb-4 shadow-sm">
            <h2 className="text-base font-semibold mb-1">7. 추천 액션</h2>
            <p className="text-xs text-gray-500 mb-4">BML-{actions[0].current_level} → BML-{actions[0].target_level} 레벨업을 위한 우선 과제</p>
            {actions.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
                <div className="text-xl">{CAT_ICONS[a.action_category] || "📋"}</div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400">{CAT_LABELS[a.action_category] || a.action_category}</div>
                  <div className="text-sm font-semibold">{a.action_item}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600">+{a.estimated_score_gain}</div>
                  <div className="text-[10px] text-gray-400">예상 점수</div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8 mb-4">
          <p>Powered by GEOcare.AI · BizSpring Inc.</p>
          <p className="mt-1">{new Date().toISOString().split("T")[0]}</p>
        </div>
      </div>
    </div>
  );
}
