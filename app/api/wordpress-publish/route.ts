import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>").replace(/$/, "</p>")
    .replace(/<p><h/g, "<h").replace(/<\/h(\d)><\/p>/g, "</h$1>")
    .replace(/<p><ul>/g, "<ul>").replace(/<\/ul><\/p>/g, "</ul>");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hub_slug, title, content_md, content_html, status, content_id } = body;

    if (!hub_slug || (!content_md && !content_html)) {
      return NextResponse.json({ error: "hub_slug and content required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get stored WP connection
    const { data: conn } = await supabase
      .from("bmp_cms_connections")
      .select("*")
      .eq("hub_slug", hub_slug)
      .eq("cms_type", "wordpress_com")
      .eq("is_active", true)
      .single();

    if (!conn) {
      return NextResponse.json({ error: "WordPress not connected", code: "NOT_CONNECTED" }, { status: 404 });
    }

    const htmlContent = content_html || mdToHtml(content_md);
    const postTitle = title || "bmp.ai 콘텐츠";

    // Create post via WordPress.com REST API
    const wpRes = await fetch(
      `https://public-api.wordpress.com/wp/v2/sites/${conn.blog_id}/posts`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${conn.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: postTitle,
          content: htmlContent,
          status: status || conn.default_status || "draft",
        }),
      }
    );

    if (!wpRes.ok) {
      const errText = await wpRes.text();
      console.error("WP publish failed:", wpRes.status, errText);

      if (wpRes.status === 401 || wpRes.status === 403) {
        return NextResponse.json({
          error: "WordPress 인증 만료. 재연동이 필요합니다.",
          code: "TOKEN_EXPIRED"
        }, { status: 401 });
      }

      return NextResponse.json({ error: "WordPress 발행 실패", details: errText }, { status: 500 });
    }

    const wpPost = await wpRes.json();

    // Update bmp_generated_contents if content_id provided
    if (content_id) {
      await supabase
        .from("bmp_generated_contents")
        .update({
          metadata: {
            wp_published: {
              post_id: wpPost.id,
              url: wpPost.link,
              site: conn.site_url,
              published_at: new Date().toISOString(),
            }
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", content_id);
    }

    return NextResponse.json({
      success: true,
      wp_post_id: wpPost.id,
      wp_url: wpPost.link,
      wp_edit_url: `https://wordpress.com/post/${conn.blog_id}/${wpPost.id}`,
      wp_status: wpPost.status,
      site_url: conn.site_url,
    });
  } catch (err: any) {
    console.error("wordpress-publish error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
