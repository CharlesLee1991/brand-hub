import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get("slug");
  const content = searchParams.get("content");
  if (!slug || !content) {
    return NextResponse.json({ error: "slug and content required" }, { status: 400 });
  }
  const efUrl = `https://nntuztaehnywdbttrajy.supabase.co/functions/v1/geobh-content-page?slug=${encodeURIComponent(slug)}&content=${encodeURIComponent(content)}`;
  const res = await fetch(efUrl);
  const html = await res.text();
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
