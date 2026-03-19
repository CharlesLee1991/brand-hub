import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const partner = searchParams.get("partner");

  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: secrets } = await supabase
    .from("gp_admin_secrets")
    .select("key_name,key_value")
    .in("key_name", ["WP_COM_CLIENT_ID"])
    .eq("is_active", true);

  const clientId = secrets?.find((s: any) => s.key_name === "WP_COM_CLIENT_ID")?.key_value;
  if (!clientId) {
    return NextResponse.json({ error: "WP client not configured" }, { status: 500 });
  }

  const state = Buffer.from(JSON.stringify({ slug, partner: partner || "" })).toString("base64url");

  const authUrl = new URL("https://public-api.wordpress.com/oauth2/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", "https://bmp.ai/api/wordpress-callback");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "posts media");
  authUrl.searchParams.set("state", state);

  return NextResponse.json({ auth_url: authUrl.toString() });
}
