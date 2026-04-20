/* app/[partner]/robots.txt/route.ts
 *  - Axis 2 발행 파이프라인 Phase C (2026-04-21)
 *  - `{hub_slug}.bmp.ai/robots.txt` → 크롤러 공개 + sitemap 경로 안내
 */

import { NextRequest } from "next/server";
import { resolveSlug } from "@/lib/config";

export const revalidate = 3600; // 1h
export const dynamic = "force-static";
export const dynamicParams = true;

export async function GET(
  _req: NextRequest,
  { params }: { params: { partner: string } }
) {
  const hubSlug = resolveSlug(params.partner);
  const body = `# BMP (Brand Management Platform) · ${hubSlug}
# Powered by Bizspring GEOcare.AI

User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /api/

# LLM-friendly crawlers — allow full content access
User-agent: GPTBot
Allow: /content/
User-agent: ClaudeBot
Allow: /content/
User-agent: Google-Extended
Allow: /content/
User-agent: PerplexityBot
Allow: /content/
User-agent: CCBot
Allow: /content/

Sitemap: https://${hubSlug}.bmp.ai/sitemap.xml
`;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
