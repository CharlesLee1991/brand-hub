/* app/[partner]/sitemap.xml/route.ts
 *  - Axis 2 발행 파이프라인 Phase C (2026-04-21)
 *  - `{hub_slug}.bmp.ai/sitemap.xml` → subdomain별 published 콘텐츠 URL 리스트
 *  - middleware가 subdomain을 /[partner]/sitemap.xml 로 rewrite해 진입
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveSlug } from "@/lib/config";

// ISR — 5분마다 재생성 (Next.js 기본 값보다 sitemap은 길어도 됨)
export const revalidate = 300;
export const dynamic = "force-static";
export const dynamicParams = true;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://nntuztaehnywdbttrajy.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type PublishedRow = {
  slug: string;
  published_at: string | null;
  updated_at: string | null;
};

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { partner: string } }
) {
  const hubSlug = resolveSlug(params.partner);

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
  });

  const { data, error } = await sb
    .from("bmp_generated_contents")
    .select("slug,published_at,updated_at")
    .eq("hub_slug", hubSlug)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5000);

  const base = `https://${hubSlug}.bmp.ai`;
  const rows = (data as PublishedRow[]) || [];

  const urls: string[] = [];

  // Homepage
  urls.push(`  <url>
    <loc>${base}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`);

  // Content pages
  for (const r of rows) {
    const loc = `${base}/content/${encodeURIComponent(r.slug)}`;
    const lastmod = r.updated_at || r.published_at;
    const lastmodTag = lastmod
      ? `\n    <lastmod>${new Date(lastmod).toISOString().split("T")[0]}</lastmod>`
      : "";
    urls.push(`  <url>
    <loc>${xmlEscape(loc)}</loc>${lastmodTag}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Sitemap-Source": `brand-hub/axis2`,
      "X-Sitemap-Count": String(rows.length),
      ...(error ? { "X-Sitemap-Error": String(error.message).slice(0, 80) } : {}),
    },
  });
}
