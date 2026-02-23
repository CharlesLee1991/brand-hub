import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 인증 불필요한 경로
const PUBLIC_PATHS = ["/login", "/demo", "/"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

  // Skip: static files, API routes, Next.js internals
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
    const currentPath = url.pathname === "/" ? "" : url.pathname;
    effectivePath = "/" + subdomain + currentPath;
  }

  // ── PUBLIC PATH → pass through ──
  const isPublic = PUBLIC_PATHS.some(p => effectivePath === p);
  if (isPublic && !subdomain) {
    return NextResponse.next();
  }

  // ── Build response (with possible rewrite) ──
  let response: NextResponse;
  if (subdomain && subdomain !== "www") {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = effectivePath;
    response = NextResponse.rewrite(rewriteUrl);
  } else {
    response = NextResponse.next();
  }

  // ── Public path with subdomain → rewrite only, no auth ──
  if (isPublic) {
    return response;
  }

  // ── PROTECTED ROUTE: Auth Check ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", effectivePath);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
