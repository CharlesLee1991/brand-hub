import { NextRequest, NextResponse } from 'next/server';

// PDP Admin API — Phase D
// 사이트/URL 관리, 배치 트리거
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nntuztaehnywdbttrajy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function supa(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
  if (path.includes('on_conflict')) {
    headers.Prefer = 'return=representation,resolution=merge-duplicates';
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');

  if (action === 'sites') {
    // 전체 사이트 목록 + URL 통계
    const { data } = await supa('GET',
      'bmp_jsonld_sites?select=*,bmp_jsonld_urls(count)&order=created_at.desc'
    );
    return NextResponse.json({ success: true, sites: data });
  }

  if (action === 'urls') {
    const siteId = request.nextUrl.searchParams.get('site_id');
    if (!siteId) return NextResponse.json({ success: false, error: 'site_id required' }, { status: 400 });
    const { data } = await supa('GET',
      `bmp_jsonld_urls?site_id=eq.${siteId}&select=*&order=created_at.desc&limit=100`
    );
    return NextResponse.json({ success: true, urls: data });
  }

  if (action === 'dashboard') {
    // 전체 현황 대시보드
    const [sites, delivery, extractions] = await Promise.all([
      supa('GET', 'bmp_jsonld_sites?select=id,site_domain,is_pdp_enabled,last_batch_at,last_batch_count'),
      supa('GET', 'bmp_jsonld_delivery?select=id&is_active=is.true'),
      supa('GET', 'bmp_jsonld_extractions?select=id'),
    ]);
    return NextResponse.json({
      success: true,
      stats: {
        total_sites: Array.isArray(sites.data) ? sites.data.length : 0,
        active_sites: Array.isArray(sites.data) ? sites.data.filter((s: { is_pdp_enabled: boolean }) => s.is_pdp_enabled).length : 0,
        delivery_cached: Array.isArray(delivery.data) ? delivery.data.length : 0,
        total_extractions: Array.isArray(extractions.data) ? extractions.data.length : 0,
      },
      sites: sites.data,
    });
  }

  return NextResponse.json({ success: false, error: 'Unknown action. Use: sites, urls, dashboard' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === 'add_site') {
    const { site_domain, pdp_source, schedule_interval, max_products } = body;
    if (!site_domain) return NextResponse.json({ success: false, error: 'site_domain required' }, { status: 400 });
    const { ok, data } = await supa('POST', 'bmp_jsonld_sites?on_conflict=site_domain', {
      site_domain,
      is_pdp_enabled: true,
      pdp_source: pdp_source || 'auto',
      schedule_interval: schedule_interval || '24h',
      max_products: max_products || 50,
    });
    return NextResponse.json({ success: ok, site: Array.isArray(data) ? data[0] : data });
  }

  if (action === 'toggle_site') {
    const { site_id, is_pdp_enabled } = body;
    if (!site_id) return NextResponse.json({ success: false, error: 'site_id required' }, { status: 400 });
    const { ok, data } = await supa('PATCH', `bmp_jsonld_sites?id=eq.${site_id}`, {
      is_pdp_enabled,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ success: ok, site: Array.isArray(data) ? data[0] : data });
  }

  if (action === 'add_urls') {
    const { site_id, urls } = body;
    if (!site_id || !urls || !Array.isArray(urls)) {
      return NextResponse.json({ success: false, error: 'site_id and urls[] required' }, { status: 400 });
    }
    const rows = urls.map((u: string) => ({
      site_id,
      product_url: u.trim(),
      status: 'pending',
    }));
    const { ok, data } = await supa('POST', 'bmp_jsonld_urls?on_conflict=site_id,product_url', rows);
    return NextResponse.json({ success: ok, added: Array.isArray(data) ? data.length : 0 });
  }

  if (action === 'trigger_batch') {
    // PDP-SCHED webhook 호출
    const webhookUrl = 'https://bawee.app.n8n.cloud/webhook/pdp-batch-extract';
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggered_by: 'admin' }),
      });
      const data = await res.json();
      return NextResponse.json({ success: true, batch_result: data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ success: false, error: 'Batch trigger failed', detail: msg });
    }
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
}
