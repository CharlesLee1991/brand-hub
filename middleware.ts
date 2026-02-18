import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain routing middleware
 * hahmshout.bmp.ai → /hahmshout
 * mprd.bmp.ai → /mprd
 * frameout.bmp.ai → /frameout
 * *.bmp.ai → /{slug}
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const url = req.nextUrl.clone();

  // Skip for API routes, static files, Next.js internals
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Extract subdomain
  // Handles: xxx.bmp.ai, xxx.brand-hub-six.vercel.app
  const baseDomains = ["bmp.ai", "brand-hub-six.vercel.app"];
  let subdomain: string | null = null;

  for (const base of baseDomains) {
    if (host.endsWith(`.${base}`)) {
      subdomain = host.replace(`.${base}`, "").split(".").pop() || null;
      break;
    }
  }

  // If subdomain found and we're on root path, rewrite to tenant page
  if (subdomain && subdomain !== "www" && url.pathname === "/") {
    url.pathname = `/${subdomain}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
