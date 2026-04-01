import { NextRequest, NextResponse } from 'next/server';

// Unified JSON-LD Serving API — Phase D
// 고객 사이트에서 호출: GET /api/jsonld-serve?url={페이지URL}
// 우선순위: delivery 캐시 → PDP 추출 → 기존 geobh-jsonld EF(GPT 생성)



const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nntuztaehnywdbttrajy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const GEOBH_EF = `${SUPABASE_URL}/functions/v1/geobh-jsonld`;
// Edge CDN 캐시: 1시간 캐시 + 24시간 stale-while-revalidate
const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
};
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};


async function supabaseQuery(path: string): Promise<unknown[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json(
      { success: false, error: 'url parameter is required' },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    // Step 1: delivery 캐시 확인 (가장 빠름)
    const delivery = await supabaseQuery(
      `bmp_jsonld_delivery?page_url=eq.${encodeURIComponent(url)}&is_active=is.true&select=jsonld_array,source,completeness_score,page_type,updated_at&limit=1`
    ) as Array<{
      jsonld_array: unknown[];
      source: string;
      completeness_score: number;
      page_type: string;
      updated_at: string;
    }>;

    if (delivery.length > 0 && delivery[0].jsonld_array && (delivery[0].jsonld_array as unknown[]).length > 0) {
      return NextResponse.json({
        success: true,
        source: 'delivery_cache',
        delivery_source: delivery[0].source,
        completeness_score: delivery[0].completeness_score,
        page_type: delivery[0].page_type,
        data: delivery[0].jsonld_array,
        cached_at: delivery[0].updated_at,
      }, { headers: CACHE_HEADERS });
    }

    // Step 2: PDP 추출 결과 확인
    const extractions = await supabaseQuery(
      `bmp_jsonld_extractions?url=eq.${encodeURIComponent(url)}&is_valid=is.true&select=final_jsonld,completeness_score,extraction_method,created_at&order=created_at.desc&limit=1`
    ) as Array<{
      final_jsonld: Record<string, unknown>;
      completeness_score: number;
      extraction_method: string;
      created_at: string;
    }>;

    if (extractions.length > 0 && extractions[0].final_jsonld) {
      const jsonldArray = [extractions[0].final_jsonld];

      // delivery 캐시에 저장 (비동기, fire-and-forget)
      const domain = new URL(url).hostname;
      fetch(`${SUPABASE_URL}/rest/v1/bmp_jsonld_delivery?on_conflict=page_url`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          site_domain: domain,
          page_url: url,
          page_type: 'product',
          source: 'extracted',
          jsonld_array: jsonldArray,
          completeness_score: extractions[0].completeness_score,
          is_active: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }),
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        source: 'pdp_extraction',
        extraction_method: extractions[0].extraction_method,
        completeness_score: extractions[0].completeness_score,
        data: jsonldArray,
        extracted_at: extractions[0].created_at,
      }, { headers: CACHE_HEADERS });
    }

    // Step 3: 기존 geobh-jsonld EF fallback (GPT 생성)
    try {
      const efRes = await fetch(`${GEOBH_EF}?url=${encodeURIComponent(url)}`);
      if (efRes.ok) {
        const efData = await efRes.json();
        if (efData.success && efData.data) {
          const jsonldArray = Array.isArray(efData.data) ? efData.data : [efData.data];

          // delivery 캐시에 저장
          const domain = new URL(url).hostname;
          fetch(`${SUPABASE_URL}/rest/v1/bmp_jsonld_delivery?on_conflict=page_url`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify({
              site_domain: domain,
              page_url: url,
              page_type: efData.page_type || 'other',
              source: 'generated',
              jsonld_array: jsonldArray,
              completeness_score: efData.score || 0,
              is_active: true,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }),
          }).catch(() => {});

          return NextResponse.json({
            success: true,
            source: 'geobh_generated',
            data: jsonldArray,
            page_type: efData.page_type,
          }, { headers: CACHE_HEADERS });
        }
      }
    } catch {
      // EF 실패 시 무시
    }

    // Step 4: 모든 소스에서 데이터 없음
    return NextResponse.json({
      success: false,
      source: 'none',
      message: 'No JSON-LD data found for this URL. Use PDP extraction first.',
      url,
    }, { headers: NO_CACHE_HEADERS });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: 'Server error', detail: msg },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
