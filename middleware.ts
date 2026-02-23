import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/demo", "/"];

// Edge Runtime에서 env 접근 보장
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

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

  const isPublic = PUBLIC_PATHS.includes(effectivePath);

  if (isPublic && !subdomain) return NextResponse.next();

  let response: NextResponse;
  if (subdomain && subdomain !== "www") {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = effectivePath;
    response = NextResponse.rewrite(rewriteUrl);
  } else {
    response = NextResponse.next();
  }

  if (isPublic) return response;

  // ── PROTECTED ROUTE ──
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // env 미설정 → 로그인으로 (안전 기본값)
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", effectivePath);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", effectivePath);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", effectivePath);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
