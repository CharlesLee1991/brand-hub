import { NextRequest, NextResponse } from 'next/server';

// Proxy to n8n PDP-001 Webhook — solves CORS issue
// Browser calls /api/pdp-extract → Vercel server calls n8n webhook
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const N8N_WEBHOOK = "https://bawee.app.n8n.cloud/webhook/pdp-jsonld-extract";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Proxy request failed", detail: msg },
      { status: 502 }
    );
  }
}
