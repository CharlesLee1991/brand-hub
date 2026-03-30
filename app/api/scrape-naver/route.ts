import { NextRequest, NextResponse } from 'next/server';

// Vercel Serverless Function: BrightData Browser API(WSS)로 네이버 SPA 렌더링
// puppeteer-core만 사용 (원격 브라우저 연결, Chromium 바이너리 불필요)

export const maxDuration = 120; // Vercel Pro: max 300s, 네이버 렌더링에 120s 확보
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'url is required' },
        { status: 400 }
      );
    }

    // 네이버 도메인 검증
    const isNaver = url.includes('smartstore.naver.com') || 
                    url.includes('shopping.naver.com') ||
                    url.includes('brand.naver.com');
    if (!isNaver) {
      return NextResponse.json(
        { success: false, error: 'Only Naver URLs are supported' },
        { status: 400 }
      );
    }

    // BrightData Browser WSS URL (Vercel 환경변수에서 조회)
    const browserWSS = process.env.BRIGHTDATA_BROWSER_WSS;
    if (!browserWSS) {
      return NextResponse.json(
        { success: false, error: 'BRIGHTDATA_BROWSER_WSS not configured' },
        { status: 500 }
      );
    }

    // puppeteer-core 동적 import (서버사이드 전용)
    const puppeteer = await import('puppeteer-core');
    
    let browser;
    try {
      // BrightData Browser API에 CDP(WSS) 연결
      browser = await puppeteer.default.connect({
        browserWSEndpoint: browserWSS,
        defaultViewport: { width: 1280, height: 720 }
      });

      const page = await browser.newPage();
      
      // 네이버 접근을 위한 헤더 설정
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      });

      // 페이지 로드 (domcontentloaded: SPA 초기 로드 후 JS가 데이터를 주입)
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });

      // SPA 데이터 로드 대기 (5초 고정 + 셀렉터 대기)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // SPA 렌더링 대기 — 상품명 셀렉터 출현 확인
      try {
        await page.waitForSelector(
          '._3xtGr, ._26MUD, .product_title, [class*="ProductName"], h2, h3',
          { timeout: 10000 }
        );
      } catch {
        // 셀렉터 미발견 시에도 HTML 수집 진행
      }

      // 페이지 타이틀
      const title = await page.title();
      
      // 렌더링된 전체 HTML
      const html = await page.content();

      // JSON-LD 추출
      const jsonldScripts = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return Array.from(scripts).map(s => {
          try { return JSON.parse(s.textContent || ''); } 
          catch { return null; }
        }).filter(Boolean);
      });

      // OG 메타 추출
      const ogMeta = await page.evaluate(() => {
        const meta: Record<string, string> = {};
        document.querySelectorAll('meta[property^="og:"]').forEach(el => {
          const prop = el.getAttribute('property')?.replace('og:', '') || '';
          const content = el.getAttribute('content') || '';
          if (prop && content) meta[prop] = content;
        });
        // product: 메타도 수집
        document.querySelectorAll('meta[property^="product:"]').forEach(el => {
          const prop = el.getAttribute('property') || '';
          const content = el.getAttribute('content') || '';
          if (prop && content) meta[prop] = content;
        });
        return meta;
      });

      await browser.close();

      return NextResponse.json({
        success: true,
        url,
        title,
        html_length: html.length,
        jsonld: jsonldScripts,
        og_meta: ogMeta,
        html: html // 전체 HTML (n8n에서 Parse PDP로 전달용)
      });

    } catch (browserError: unknown) {
      if (browser) {
        try { await browser.close(); } catch {}
      }
      const errorMessage = browserError instanceof Error ? browserError.message : String(browserError);
      return NextResponse.json(
        { success: false, error: 'Browser rendering failed', detail: errorMessage },
        { status: 502 }
      );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: 'Request processing failed', detail: errorMessage },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'scrape-naver',
    description: 'BrightData Browser API + puppeteer-core for Naver SPA rendering'
  });
}
