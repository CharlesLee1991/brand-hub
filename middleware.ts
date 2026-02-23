import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/demo", "/"];

// Supabase project ref (from URL: https://nntuztaehnywdbttrajy.supabase.co)
const SB_REF = "nntuztaehnywdbttrajy";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

  // Skip static files, API routes, Next.js internals
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── SUBDOMAIN ROUTING ──
  const baseDomains = ["bmp.ai", "brand-hub-six.vercel.app"];
  let subdomain: string | null = null;
  for (const base of baseDomains) {
    if (host.endsWith("." + base)) {
      subdomain = host.replace("." + base, "").split(".").pop() || null;
      break;
    }
  }

  let effectivePath = url.pathname;
  if (subdomain && subdomain !== "www") {
    effectivePath = "/" + subdomain + (url.pathname === "/" ? "" : url.pathname);
  }

  // ── PUBLIC PATHS ──
  const isPublic = PUBLIC_PATHS.includes(effectivePath);

  if (isPublic && !subdomain) return NextResponse.next();

  // Build response (rewrite for subdomain, next for regular)
  let response: NextResponse;
  if (subdomain && subdomain !== "www") {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = effectivePath;
    response = NextResponse.rewrite(rewriteUrl);
  } else {
    response = NextResponse.next();
  }

  if (isPublic) return response;

  // ── AUTH CHECK (cookie-based) ──
  // Supabase stores auth in cookies prefixed with sb-{ref}-auth-token
  // In @supabase/ssr, cookies may be chunked: sb-{ref}-auth-token.0, .1, etc.
  const cookies = req.cookies.getAll();
  const hasAuthCookie = cookies.some(
    (c) => c.name.startsWith("sb-" + SB_REF + "-auth-token")
  );

  if (!hasAuthCookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", effectivePath);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
