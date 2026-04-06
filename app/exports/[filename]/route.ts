import { NextRequest, NextResponse } from "next/server";

const STORAGE_BASE = "https://nntuztaehnywdbttrajy.supabase.co/storage/v1/object/public/gamma-exports";

const MIME: Record<string, string> = {
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  png: "image/png",
};

function getSlugFromHost(host: string): string | null {
  // ivanahelsinki.bmp.ai → ivanahelsinki
  // xxx.brand-hub-six.vercel.app → xxx
  if (host.endsWith(".bmp.ai")) {
    const parts = host.split(".");
    if (parts.length === 3) return parts[0];
  }
  if (host.endsWith(".vercel.app")) {
    const parts = host.split(".");
    if (parts.length >= 3) return parts[0];
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const host = req.headers.get("host") || "";
  const slug = getSlugFromHost(host) || req.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "Could not determine client slug from subdomain" },
      { status: 400 }
    );
  }

  const filename = params.filename;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const storageUrl = `${STORAGE_BASE}/${slug}/${filename}`;

  const res = await fetch(storageUrl);
  if (!res.ok) {
    return NextResponse.json(
      { error: "File not found", slug, filename },
      { status: 404 }
    );
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME[ext] || "application/octet-stream";
  const body = res.body;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
