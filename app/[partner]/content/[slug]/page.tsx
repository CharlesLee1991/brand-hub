/* app/[partner]/content/[slug]/page.tsx
 *  - Axis 2 발행 파이프라인 Phase A (2026-04-21)
 *  - `{hub_slug}.bmp.ai/content/{slug}` → 이 파일이 렌더
 *  - middleware가 서브도메인을 /[partner]/... 로 rewrite해 진입
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@supabase/supabase-js";
import { resolveSlug } from "@/lib/config";
import { buildArticleJsonLd } from "@/lib/content-jsonld";

// ISR — LLM 크롤러 반복 방문 대비, 60초 revalidate
export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://nntuztaehnywdbttrajy.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type ContentRow = {
  id: string;
  hub_slug: string;
  slug: string;
  title: string;
  description: string | null;
  body_md: string;
  body_html: string | null;
  jsonld_data: Record<string, unknown> | null;
  published_at: string | null;
  updated_at: string | null;
  featured_image_url: string | null;
  status: string;
};

async function fetchContent(
  hubSlug: string,
  contentSlug: string
): Promise<ContentRow | null> {
  // SSR 시 anon key 사용 — RLS `public_read_published`가 status='published'만 노출
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
  });
  const decoded = decodeURIComponent(contentSlug);
  const { data, error } = await sb
    .from("bmp_generated_contents")
    .select(
      "id,hub_slug,slug,title,description,body_md,body_html,jsonld_data,published_at,updated_at,featured_image_url,status"
    )
    .eq("hub_slug", hubSlug)
    .eq("slug", decoded)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    // RLS 실패나 네트워크 오류. 404로 떨어뜨리면 복구 기회를 놓치니 로그만 남기고 null.
    console.error("[content/[slug]] fetch error:", error);
    return null;
  }
  return (data as ContentRow) || null;
}

export async function generateMetadata({
  params,
}: {
  params: { partner: string; slug: string };
}): Promise<Metadata> {
  const hubSlug = resolveSlug(params.partner);
  const row = await fetchContent(hubSlug, params.slug);
  if (!row) {
    return { title: "콘텐츠를 찾을 수 없습니다 · BMP" };
  }
  const url = `https://${hubSlug}.bmp.ai/content/${encodeURIComponent(row.slug)}`;
  const desc =
    row.description ||
    row.body_md.replace(/[#*_`>[\]()!-]/g, "").slice(0, 150);
  return {
    title: `${row.title} · ${hubSlug}`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: row.title,
      description: desc,
      url,
      type: "article",
      publishedTime: row.published_at || undefined,
      modifiedTime: row.updated_at || undefined,
      images: row.featured_image_url ? [row.featured_image_url] : undefined,
      siteName: `${hubSlug} · BMP`,
    },
    twitter: {
      card: "summary_large_image",
      title: row.title,
      description: desc,
      images: row.featured_image_url ? [row.featured_image_url] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ContentPage({
  params,
}: {
  params: { partner: string; slug: string };
}) {
  const hubSlug = resolveSlug(params.partner);
  const row = await fetchContent(hubSlug, params.slug);
  if (!row) notFound();

  // JSON-LD: DB 저장된 값 우선, 없으면 자동 합성
  const jsonLd =
    row.jsonld_data && Object.keys(row.jsonld_data).length > 0
      ? row.jsonld_data
      : buildArticleJsonLd({
          title: row.title,
          description: row.description,
          bodyMd: row.body_md,
          hubSlug,
          slug: row.slug,
          publishedAt: row.published_at,
          updatedAt: row.updated_at,
          featuredImageUrl: row.featured_image_url,
        });

  const publishedDate = row.published_at
    ? new Date(row.published_at).toISOString().split("T")[0]
    : "";

  return (
    <>
      {/* Article JSON-LD for LLM crawlers & Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-white">
        <article className="max-w-3xl mx-auto px-4 py-12">
          {/* Header */}
          <header className="mb-10 pb-6 border-b border-gray-200">
            <div className="text-xs tracking-widest text-gray-400 mb-3 uppercase">
              {hubSlug} · BMP
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {row.title}
            </h1>
            {row.description && (
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                {row.description}
              </p>
            )}
            {publishedDate && (
              <div className="mt-4 text-sm text-gray-400">
                <time dateTime={row.published_at || undefined}>
                  {publishedDate}
                </time>
              </div>
            )}
          </header>

          {/* Featured image */}
          {row.featured_image_url && (
            <div className="mb-8 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.featured_image_url}
                alt={row.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Body — Markdown 렌더 (prose 스타일은 Tailwind 기본값 없으면 수동) */}
          <div className="article-body text-gray-800 leading-[1.85]">
            <ReactMarkdown
              components={{
                h1: (p) => (
                  <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900" {...p} />
                ),
                h2: (p) => (
                  <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900" {...p} />
                ),
                h3: (p) => (
                  <h3 className="text-xl font-semibold mt-8 mb-3 text-gray-900" {...p} />
                ),
                p: (p) => <p className="mb-5 text-base" {...p} />,
                ul: (p) => <ul className="list-disc pl-6 mb-5 space-y-2" {...p} />,
                ol: (p) => <ol className="list-decimal pl-6 mb-5 space-y-2" {...p} />,
                li: (p) => <li className="text-base" {...p} />,
                blockquote: (p) => (
                  <blockquote
                    className="border-l-4 border-blue-400 pl-4 py-2 my-6 bg-blue-50 text-gray-700 italic"
                    {...p}
                  />
                ),
                a: (p) => (
                  <a
                    className="text-blue-600 underline hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...p}
                  />
                ),
                code: (p) => (
                  <code
                    className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono"
                    {...p}
                  />
                ),
                hr: () => <hr className="my-10 border-gray-200" />,
              }}
            >
              {row.body_md}
            </ReactMarkdown>
          </div>

          {/* Footer — E-E-A-T 시그널 + AI 면책(기본 비활성, 향후 설정 가능) */}
          <footer className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500">
            <p>
              본 콘텐츠는 <strong>{hubSlug}</strong> 브랜드가 BMP (Brand
              Management Platform)를 통해 게시한 공식 콘텐츠입니다.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Powered by{" "}
              <a
                href="https://bmp.ai"
                className="underline hover:text-gray-600"
              >
                BMP
              </a>{" "}
              · GEOcare.AI
            </p>
          </footer>
        </article>
      </main>
    </>
  );
}
