import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getSecret(keyName: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from("gp_admin_secrets")
    .select("key_value")
    .eq("key_name", keyName)
    .eq("is_active", true)
    .single();
  return data?.key_value || "";
}

const SYSTEM_PROMPT = `당신은 GEO(Generative Engine Optimization) 전문가입니다. 
웹페이지 콘텐츠를 분석하여 AI 검색엔진(ChatGPT, Perplexity, Gemini 등)에서 인용될 확률을 높이는 개선 콘텐츠를 생성합니다.

반드시 다음 형식으로 응답하세요:

## E-E-A-T 진단
각 항목별 현재 상태와 개선 포인트:
- 경험(E): 
- 전문성(E): 
- 권위(A): 
- 신뢰(T): 

## 개선된 콘텐츠
아래에 완전히 새로 작성된 개선 콘텐츠를 마크다운으로 작성하세요.
- 원본의 핵심 정보를 모두 포함하면서
- E-E-A-T 요소를 강화하고
- AI 검색엔진이 인용하기 좋은 구조(팩트 문장, 구조화된 정보)로 재구성
- JSON-LD Schema.org 코드도 포함

## AI 인용 팩트 문장
AI 검색엔진이 그대로 인용할 수 있는 핵심 팩트 문장 3~5개를 작성하세요.`;

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const { page_url, page_title, page_markdown, llm, brand_name } = body;

    if (!page_markdown) {
      return NextResponse.json({ error: "page_markdown required" }, { status: 400 });
    }

    const truncatedMd = page_markdown.slice(0, 12000);
    const userPrompt = `브랜드: ${brand_name || ""}
페이지 URL: ${page_url || ""}
페이지 제목: ${page_title || ""}

--- 원본 콘텐츠 ---
${truncatedMd}
--- 끝 ---

위 페이지를 E-E-A-T 기준으로 분석하고 AI 검색엔진 인용에 최적화된 개선 콘텐츠를 생성해주세요.`;

    const selectedLlm = llm || "claude";
    let result = "";

    if (selectedLlm === "claude") {
      const apiKey = await getSecret("ANTHROPIC_API_KEY");
      if (!apiKey) return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: "Claude API error", details: errText }, { status: 500 });
      }

      const data = await res.json();
      result = data.content?.[0]?.text || "";
    } else {
      const apiKey = await getSecret("OPENAI_API_KEY");
      if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: 4096,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: "GPT API error", details: errText }, { status: 500 });
      }

      const data = await res.json();
      result = data.choices?.[0]?.message?.content || "";
    }

    const elapsed = Date.now() - start;

    return NextResponse.json({
      success: true,
      improvements: result,
      llm: selectedLlm,
      llm_name: selectedLlm === "claude" ? "Claude Sonnet" : "GPT-4o",
      page_url,
      page_title,
      elapsed_ms: elapsed,
      char_count: result.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
