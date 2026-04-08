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

/* ── helpers ── */
function getSlugFromHost(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host.endsWith(".bmp.ai") && host.split(".").length === 3) return host.split(".")[0];
  if (host.endsWith(".vercel.app") && host.split(".").length >= 3) return host.split(".")[0];
  return null;
}

/* ── GammaEmbed: iframe blocked by Gamma → show brand page + link card ── */
/* Gamma blocks iframe embedding, so gamma mode now renders BrandSite + link */

/* ── BrandSite: method 1 — self-rendered consumer brand page ── */
function BrandSite({
  client, brandConfig, faqs, commentary,
}: {
  client: ClientData;
  brandConfig: BrandConfig | null;
  faqs: FaqItem[];
  commentary: string | null;
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
  const [commentary, setCommentary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageUrl, setStorageUrl] = useState<string | null>(null);

  useEffect(() => {
    const s = searchParams.get("slug") || getSlugFromHost();
    setSlug(s);
    if (!s) { setError("no-slug"); setLoading(false); return; }

    fetch(SUPABASE_URL + "/rest/v1/bmp_partner_clients?client_slug=eq." + s + "&status=eq.active&select=client_name,client_slug,client_url,client_industry,site_mode,gamma_site_url&limit=1", {
      headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.[0]) { setError("not-found"); setLoading(false); return; }
        const c = data[0] as ClientData;
        setClient(c);

        /* gamma mode: also render self, just store gamma URL for link */
        if (c.site_mode === "gamma" && c.gamma_site_url) {
          /* fall through to check storage */
        }

        /* disabled mode: show coming-soon */
        if (c.site_mode === "disabled" || !c.site_mode) {
          setLoading(false);
          return;
        }

        /* Check if brandhub-sites Storage has HTML for this slug */
        const hubHtmlUrl = SUPABASE_URL + "/storage/v1/object/public/brandhub-sites/" + s + "/index.html";
        fetch(hubHtmlUrl, { method: "HEAD" })
          .then((r) => {
            if (r.ok) {
              setStorageUrl(hubHtmlUrl);
              setLoading(false);
              return;
            }
            /* No storage HTML → fetch brand data for React rendering */
            return Promise.all([
              fetch(BAWEE_EF + "/geobh-data?slug=" + s).then((r) => r.ok ? r.json() : null).catch(() => null),
              fetch(BAWEE_EF + "/geobh-ai-commentary?slug=" + s + "&tab=overview").then((r) => r.ok ? r.json() : null).catch(() => null),
            ]).then(([brand, comm]) => {
              if (brand?.config) setBrandConfig(brand.config);
              if (brand?.faqs) setFaqs(brand.faqs.filter((f: any) => f.question && f.answer).slice(0, 8));
              const raw = comm?.commentary;
              const txt = typeof raw === "string" ? raw : raw?.claude || raw?.gpt || null;
              if (txt) setCommentary(txt.length > 1200 ? txt.slice(0, 1200) + "..." : txt);
            }).finally(() => setLoading(false));
          })
          .catch(() => setLoading(false));
      })
      .catch(() => { setError("fetch-error"); setLoading(false); });
  }, [searchParams]);

  /* ── Render ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">페이지를 찾을 수 없습니다.</p>
      </div>
    );
  }

  /* Storage HTML (brandhub-sites) — highest priority */
  if (storageUrl) {
    return (
      <div className="min-h-screen">
        <iframe
          src={storageUrl}
          className="w-full border-0"
          style={{ height: "100vh", minHeight: "100vh" }}
          title={client.client_name + " Brand Hub"}
        />
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

  /* Method 1: Self-rendered brand site (brandhub mode) */
  return <BrandSite client={client} brandConfig={brandConfig} faqs={faqs} commentary={commentary} />;
}
