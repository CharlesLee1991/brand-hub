/* lib/content-jsonld.ts — Article JSON-LD 생성
 *  - Axis 2 발행 파이프라인 Phase A (2026-04-21)
 *  - bmp_generated_contents.jsonld_data 있으면 그대로, 없으면 자동 합성
 */

export type JsonLdInput = {
  title: string;
  description?: string | null;
  bodyMd: string;
  hubSlug: string;
  slug: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  featuredImageUrl?: string | null;
  authorName?: string | null;
};

/**
 * Article schema (schema.org/Article) JSON-LD 합성.
 * LLM 크롤러가 E-E-A-T 시그널로 활용하는 최소 필드만 담는다.
 */
export function buildArticleJsonLd(input: JsonLdInput): Record<string, unknown> {
  const url = `https://${input.hubSlug}.bmp.ai/content/${encodeURIComponent(input.slug)}`;
  const wordCount = (input.bodyMd.match(/\S+/g) || []).length;
  const description =
    input.description && input.description.trim().length > 0
      ? input.description
      : extractFirstParagraph(input.bodyMd, 160);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "ko-KR",
    wordCount,
    articleSection: "Brand Story",
    datePublished: input.publishedAt || undefined,
    dateModified: input.updatedAt || input.publishedAt || undefined,
    image: input.featuredImageUrl || undefined,
    author: {
      "@type": "Organization",
      name: input.authorName || input.hubSlug,
      url: `https://${input.hubSlug}.bmp.ai`,
    },
    publisher: {
      "@type": "Organization",
      name: "Bizspring BMP (Brand Management Platform)",
      url: "https://bmp.ai",
    },
  };

  // undefined 키 제거 (JSON-LD 스펙상 null도 불필요)
  return stripNulls(jsonLd);
}

function extractFirstParagraph(md: string, max: number): string {
  // 코드블록/헤더/이미지 제거 후 첫 문단 추출
  const cleaned = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#+\s.*$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/>\s.*$/gm, "")
    .trim();
  const firstPara = cleaned.split(/\n\s*\n/)[0] || cleaned;
  const plain = firstPara.replace(/[*_`>#-]/g, "").replace(/\s+/g, " ").trim();
  return plain.length > max ? plain.slice(0, max - 1) + "…" : plain;
}

function stripNulls<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      const nested = stripNulls(v as Record<string, unknown>);
      if (Object.keys(nested).length > 0) out[k] = nested;
    } else {
      out[k] = v;
    }
  }
  return out as T;
}
