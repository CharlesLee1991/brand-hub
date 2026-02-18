/* lib/config.ts — Brand Hub 중앙 설정 */

export const BAWEE_EF_URL = "https://nntuztaehnywdbttrajy.supabase.co/functions/v1";

// 대행사 → 고객 EEAT 분석 매핑 (DB에 매핑 테이블 추가 전까지 사용)
export const PARTNER_CLIENT_MAP: Record<string, string> = {
  hahmshout: "samsung-hospital",
  mprd: "taxtok",
  frameout: "yedaham",
  mplanit: "shoppingnt",
};

// 서브도메인 alias → canonical slug
export const SUBDOMAIN_ALIAS: Record<string, string> = {
  hamshout: "hahmshout",
};

export function resolveSlug(raw: string): string {
  return SUBDOMAIN_ALIAS[raw] || raw;
}
