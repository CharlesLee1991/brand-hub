import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?wp_error=" + encodeURIComponent(error), req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?wp_error=missing_params", req.url));
  }

  let stateData: { slug: string; partner: string };
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return NextResponse.redirect(new URL("/?wp_error=invalid_state", req.url));
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: secrets } = await supabase
    .from("gp_admin_secrets")
    .select("key_name,key_value")
    .in("key_name", ["WP_COM_CLIENT_ID", "WP_COM_CLIENT_SECRET"])
    .eq("is_active", true);

  const clientId = secrets?.find((s: any) => s.key_name === "WP_COM_CLIENT_ID")?.key_value;
  const clientSecret = secrets?.find((s: any) => s.key_name === "WP_COM_CLIENT_SECRET")?.key_value;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`/?wp_error=config_missing&wp_detail=${encodeURIComponent(`id:${!!clientId},secret:${!!clientSecret},count:${secrets?.length || 0}`)}`, req.url));
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://public-api.wordpress.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: "https://bmp.ai/api/wordpress-callback",
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("WP token exchange failed:", tokenRes.status, errText);
    // Include error details for debugging
    const errDetail = encodeURIComponent(errText.slice(0, 200));
    return NextResponse.redirect(new URL(`/?wp_error=token_failed&wp_detail=${errDetail}&wp_status=${tokenRes.status}`, req.url));
  }

  const tokenData = await tokenRes.json();
  // tokenData: { access_token, token_type, blog_id, blog_url, scope }

  // Get site info for display
  let siteUrl = tokenData.blog_url || "";
  const blogId = String(tokenData.blog_id || "");

  // Upsert connection
  const { error: dbError } = await supabase
    .from("bmp_cms_connections")
    .upsert({
      hub_slug: stateData.slug,
      partner_slug: stateData.partner || null,
      cms_type: "wordpress_com",
      site_url: siteUrl,
      blog_id: blogId,
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || "bearer",
      is_active: true,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "hub_slug,cms_type" });

  if (dbError) {
    console.error("DB upsert error:", dbError);
    return NextResponse.redirect(new URL("/?wp_error=db_failed", req.url));
  }

  // Redirect back to the brand hub page with success
  const redirectPath = stateData.partner
    ? `/${stateData.partner}/${stateData.slug}`
    : `/${stateData.slug}`;

  return NextResponse.redirect(new URL(redirectPath + "?wp_connected=true", req.url));
}
