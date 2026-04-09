"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nntuztaehnywdbttrajy.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const BAWEE_EF = SUPABASE_URL + "/functions/v1";

/* ── types ── */
interface ClientData {
  client_name: string;
  client_slug: string;
  client_url: string | null;
  client_industry: string | null;
  site_mode: string;
  gamma_site_url: string | null;
}

interface BrandConfig {
  brand_name: string;
  brand_description: string;
  primary_color: string;
  logo_url: string | null;
  site_domain: string;
}

interface FaqItem { question: string; answer: string; }
interface ProductItem { url: string; name: string; image: string | null; price: string | null; }

interface PartnerHubConfig {
  hub_slug: string;
  brand_name: string;
  brand_description: string | null;
  primary_color: string | null;
  logo_url: string | null;
  site_domain: string | null;
}

interface PartnerClient {
  client_slug: string;
  client_name: string;
  client_url: string | null;
  client_industry: string | null;
  status: string;
  diagnosis_status: string | null;
}

/* ── helpers ── */
function getSlugFromHost(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host.endsWith(".bmp.ai") && host.split(".").length === 3) return host.split(".")[0];
  if (host.endsWith(".vercel.app") && host.split(".").length >= 3) return host.split(".")[0];
  return null;
}

/* ── PartnerLanding: partner hub page showing their clients ── */
function PartnerLanding({
  config, clients,
}: {
  config: PartnerHubConfig;
  clients: PartnerClient[];
}) {
  const primaryColor = config.primary_color || "#3B82F6";
  const logoUrl = config.logo_url;
  const brandName = config.brand_name;
  const activeClients = clients.filter(c => c.status === "active");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl
              ? <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
              : <span className="text-xl font-bold" style={{ color: primaryColor }}>{brandName}</span>}
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#clients" className="hover:text-gray-900">관리 브랜드</a>
            <a href="#about" className="hover:text-gray-900">소개</a>
            {config.site_domain && (
              <a href={config.site_domain} target="_blank" rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-full text-white text-xs font-medium"
                style={{ backgroundColor: primaryColor }}>공식 사이트</a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6"
        style={{ background: "linear-gradient(135deg, " + primaryColor + "08, " + primaryColor + "15)" }}>
        <div className="max-w-4xl mx-auto text-center">
          {logoUrl && <img src={logoUrl} alt={brandName} className="h-16 mx-auto mb-6" />}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{brandName}</h1>
          <p className="text-lg text-gray-500 mb-2">GEOcare.AI 공식 파트너</p>
          {config.brand_description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4">{config.brand_description}</p>
          )}
          <div className="flex justify-center gap-6 mt-8">
            <div className="bg-white rounded-xl px-6 py-3 shadow-sm">
              <p className="text-2xl font-bold" style={{ color: primaryColor }}>{activeClients.length}</p>
              <p className="text-xs text-gray-500">관리 브랜드</p>
            </div>
            <div className="bg-white rounded-xl px-6 py-3 shadow-sm">
              <p className="text-2xl font-bold text-green-600">
                {activeClients.filter(c => c.diagnosis_status === "complete").length}
              </p>
              <p className="text-xs text-gray-500">GEO 진단 완료</p>
            </div>
          </div>
        </div>
      </section>

      {/* Clients */}
      <section id="clients" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-3 text-center">관리 브랜드</h2>
          <p className="text-gray-500 text-center mb-12">GEO 최적화를 진행 중인 브랜드입니다</p>
          {activeClients.length === 0 ? (
            <p className="text-center text-gray-400">등록된 브랜드가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeClients.map((c) => (
                <div key={c.client_slug}
                  className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold">{c.client_name}</h3>
                    <span className={
                      "text-xs px-2 py-1 rounded-full font-medium " +
                      (c.diagnosis_status === "complete"
                        ? "bg-green-50 text-green-700"
                        : c.diagnosis_status === "pending"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-gray-50 text-gray-500")
                    }>
                      {c.diagnosis_status === "complete" ? "진단완료" :
                       c.diagnosis_status === "pending" ? "진단중" : "대기"}
                    </span>
                  </div>
                  {c.client_industry && (
                    <p className="text-sm text-gray-500 mb-3">{c.client_industry}</p>
                  )}
                  {c.client_url && (
                    <a href={c.client_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm hover:underline" style={{ color: primaryColor }}>
                      {c.client_url.replace(/^https?:\/\//, "").replace(/\/$/, "")} →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">파트너 소개</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            {brandName}는 GEOcare.AI 공인 파트너로서,
            AI 검색 최적화(GEO) 전략 수립부터 실행까지 전 과정을 지원합니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-bold mb-2">GEO 진단</h3>
              <p className="text-sm text-gray-500">AI 검색 노출 현황 분석 및 개선점 도출</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-bold mb-2">SoM 분석</h3>
              <p className="text-sm text-gray-500">AI 검색 점유율 모니터링 및 경쟁 분석</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="font-bold mb-2">최적화 실행</h3>
              <p className="text-sm text-gray-500">E-E-A-T 강화, 구조화 데이터, 콘텐츠 전략</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6"
        style={{ background: "linear-gradient(135deg, " + primaryColor + ", " + primaryColor + "cc)" }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">AI 검색 최적화, 지금 시작하세요</h2>
          <p className="text-lg mb-8 opacity-90">
            {brandName}와 함께 AI 검색에서 브랜드 인용률을 높이세요.
          </p>
          <a href="https://geocare.ai" target="_blank" rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-white font-bold rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: primaryColor }}>
            GEOcare.AI 바로가기
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{brandName}</span>
            <span className="text-xs">· GEOcare.AI Partner</span>
          </div>
          <div className="text-xs text-center">
            Powered by <a href="https://bmp.ai" className="text-blue-400 hover:underline">bmp.ai</a> · © 2026 BizSpring Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── BrandSite: method 1 — self-rendered consumer brand page ── */
function BrandSite({
  client, brandConfig, faqs, commentary, products,
}: {
  client: ClientData;
  brandConfig: BrandConfig | null;
  faqs: FaqItem[];
  commentary: string | null;
  products: ProductItem[];
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const brandName = client.client_name;
  const industry = client.client_industry || "";
  const brandDesc = brandConfig?.brand_description || "";
  const siteUrl = client.client_url || brandConfig?.site_domain || "";
  const primaryColor = brandConfig?.primary_color || "#3B82F6";
  const logoUrl = brandConfig?.logo_url;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl
              ? <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
              : <span className="text-xl font-bold" style={{ color: primaryColor }}>{brandName}</span>}
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#about" className="hover:text-gray-900">소개</a>
            {products.length > 0 && <a href="#products" className="hover:text-gray-900">제품</a>}
            {faqs.length > 0 && <a href="#faq" className="hover:text-gray-900">FAQ</a>}
            <a href="#contact" className="hover:text-gray-900">문의</a>
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-full text-white text-xs font-medium"
                style={{ backgroundColor: primaryColor }}>공식 사이트</a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6" style={{ background: "linear-gradient(135deg, " + primaryColor + "08, " + primaryColor + "15)" }}>
        <div className="max-w-4xl mx-auto text-center">
          {logoUrl && <img src={logoUrl} alt={brandName} className="h-16 mx-auto mb-6" />}
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{brandName}</h1>
          {industry && <p className="text-lg text-gray-500 mb-4">{industry}</p>}
          {brandDesc && <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{brandDesc}</p>}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                className="px-8 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                style={{ backgroundColor: primaryColor }}>{brandName} 방문하기 →</a>
            )}
          </div>
        </div>
      </section>

      {/* About / Brand Story */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">{brandName} 소개</h2>
          {commentary ? (
            <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
              {commentary.replace(/#{1,3}\s*/g, "").replace(/\*\*/g, "")}
            </div>
          ) : brandDesc ? (
            <p className="text-lg text-gray-600 leading-relaxed text-center">{brandDesc}</p>
          ) : (
            <p className="text-lg text-gray-600 leading-relaxed text-center">
              {brandName}는 {industry ? industry + " 분야의 " : ""}전문 브랜드입니다.
            </p>
          )}
        </div>
      </section>

      {/* Products */}
      {products.length > 0 && (
        <section id="products" className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p, i) => (
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                  {p.image ? (
                    <div className="aspect-[3/4] overflow-hidden">
                      <img src={p.image} alt={p.name} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-300 text-4xl">📷</span>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{p.name}</h3>
                    {p.price && <p className="text-sm font-bold" style={{ color: primaryColor }}>{p.price}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section id="faq" className="py-20 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">자주 묻는 질문</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <span className="font-medium text-sm pr-4">{faq.question}</span>
                    <span className="text-gray-400 flex-shrink-0">{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {faq.answer.slice(0, 500)}{faq.answer.length > 500 ? "..." : ""}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section id="contact" className="py-20 px-6" style={{ background: "linear-gradient(135deg, " + primaryColor + ", " + primaryColor + "cc)" }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">{brandName}에 대해 더 알아보세요</h2>
          <p className="text-lg mb-8 opacity-90">
            {industry ? industry + " 분야에서 " : ""}{brandName}가 제공하는 가치를 확인하세요.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                className="px-8 py-3 bg-white font-bold rounded-lg hover:bg-gray-100"
                style={{ color: primaryColor }}>공식 사이트 방문</a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{brandName}</span>
            {industry && <span className="text-xs">· {industry}</span>}
          </div>
          <div className="text-xs text-center">
            Powered by <a href="https://bmp.ai" className="text-blue-400 hover:underline">bmp.ai</a> · © 2026 BizSpring Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Main Component ── */
export default function SiteContent() {
  const searchParams = useSearchParams();
  const [slug, setSlug] = useState<string | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [commentary, setCommentary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageHtml, setStorageHtml] = useState<string | null>(null);
  /* Partner hub state */
  const [partnerConfig, setPartnerConfig] = useState<PartnerHubConfig | null>(null);
  const [partnerClients, setPartnerClients] = useState<PartnerClient[]>([]);
  const [isPartnerHub, setIsPartnerHub] = useState(false);

  useEffect(() => {
    const s = searchParams.get("slug") || getSlugFromHost();
    setSlug(s);
    if (!s) { setError("no-slug"); setLoading(false); return; }

    /* Step 1: Try client lookup */
    fetch(SUPABASE_URL + "/rest/v1/bmp_partner_clients?client_slug=eq." + s + "&status=eq.active&select=client_name,client_slug,client_url,client_industry,site_mode,gamma_site_url&limit=1", {
      headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]) {
          /* Found as client → existing brand page flow */
          const c = data[0] as ClientData;
          setClient(c);
          handleClientData(c, s);
          return;
        }

        /* Step 2: Not a client → try partner hub_config lookup */
        fetch(SUPABASE_URL + "/rest/v1/gp_geobh_hub_config?hub_slug=eq." + s + "&hub_enabled=eq.true&select=hub_slug,brand_name,brand_description,primary_color,logo_url,site_domain&limit=1", {
          headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON },
        })
          .then((r) => r.json())
          .then((hubData) => {
            if (!hubData?.[0]) {
              setError("not-found");
              setLoading(false);
              return;
            }
            /* Found as partner → fetch partner's clients */
            const hub = hubData[0] as PartnerHubConfig;
            setPartnerConfig(hub);
            setIsPartnerHub(true);

            fetch(SUPABASE_URL + "/rest/v1/bmp_partner_clients?partner_slug=eq." + s + "&select=client_slug,client_name,client_url,client_industry,status,diagnosis_status", {
              headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON },
            })
              .then((r) => r.json())
              .then((cl) => { setPartnerClients(cl || []); setLoading(false); })
              .catch(() => setLoading(false));
          })
          .catch(() => { setError("not-found"); setLoading(false); });
      })
      .catch(() => { setError("fetch-error"); setLoading(false); });
  }, [searchParams]);

  /* Handle client data (existing logic extracted) */
  function handleClientData(c: ClientData, s: string) {
    if (c.site_mode === "gamma" && c.gamma_site_url) {
      /* fall through to check storage */
    }

    if (c.site_mode === "disabled" || !c.site_mode) {
      setLoading(false);
      return;
    }

    const hubHtmlUrl = SUPABASE_URL + "/storage/v1/object/public/brandhub-sites/" + s + "/index.html";
    fetch(hubHtmlUrl)
      .then((r) => {
        if (r.ok) return r.text();
        return null;
      })
      .then((html) => {
        if (html && html.startsWith("<!DOCTYPE") || html && html.startsWith("<html")) {
          setStorageHtml(html);
          setLoading(false);
          return;
        }
        return Promise.all([
          fetch(BAWEE_EF + "/geobh-data?slug=" + s).then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch(BAWEE_EF + "/geobh-ai-commentary?slug=" + s + "&tab=overview").then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch(BAWEE_EF + "/geobh-products?slug=" + s).then((r) => r.ok ? r.json() : null).catch(() => null),
        ]).then(([brand, comm, prods]) => {
          if (brand?.config) setBrandConfig(brand.config);
          if (brand?.faqs) setFaqs(brand.faqs.filter((f: any) => f.question && f.answer).slice(0, 8));
          const raw = comm?.commentary;
          const txt = typeof raw === "string" ? raw : raw?.claude || raw?.gpt || null;
          if (txt) setCommentary(txt.length > 1200 ? txt.slice(0, 1200) + "..." : txt);
          if (prods?.products) setProducts(prods.products);
        }).finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }

  /* ── Render ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">페이지를 찾을 수 없습니다.</p>
      </div>
    );
  }

  /* Partner Hub page */
  if (isPartnerHub && partnerConfig) {
    return <PartnerLanding config={partnerConfig} clients={partnerClients} />;
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">페이지를 찾을 수 없습니다.</p>
      </div>
    );
  }

  /* Disabled: coming soon */
  if (client.site_mode === "disabled" || !client.site_mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-4">{client.client_name}</h1>
        <p className="text-gray-500 mb-8">허브사이트가 준비 중입니다.</p>
        {client.client_url && (
          <a href={client.client_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            공식 웹사이트 방문 →
          </a>
        )}
        <p className="text-xs text-gray-300 mt-12">Powered by <a href="https://bmp.ai" className="hover:underline">bmp.ai</a></p>
      </div>
    );
  }

  /* Gamma mode: EF-generated static HTML via iframe (pre-contract demo) */
  if (client.site_mode === "gamma") {
    if (storageHtml) {
      return (
        <div className="min-h-screen">
          <iframe
            srcDoc={storageHtml}
            className="w-full border-0"
            style={{ height: "100vh", minHeight: "100vh" }}
            title={client.client_name + " Brand Hub"}
            sandbox="allow-same-origin allow-scripts allow-popups allow-top-navigation"
          />
        </div>
      );
    }
    if (client.gamma_site_url) {
      return (
        <div className="min-h-screen">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">{client.client_name} 브랜드 허브</p>
            <a href={client.gamma_site_url} target="_blank" rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              브랜드 페이지 보기 →
            </a>
          </div>
          <BrandSite client={client} brandConfig={brandConfig} faqs={faqs} commentary={commentary} products={products} />
        </div>
      );
    }
    return <BrandSite client={client} brandConfig={brandConfig} faqs={faqs} commentary={commentary} products={products} />;
  }

  /* Brandhub mode: self-rendered React brand site (post-contract, customizable) */
  return <BrandSite client={client} brandConfig={brandConfig} faqs={faqs} commentary={commentary} products={products} />;
}
