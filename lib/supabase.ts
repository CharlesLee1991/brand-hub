import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// KHub API 호출 헬퍼
export async function queryKHub(tenantCode: string, query: string) {
  const apiUrl = process.env.NEXT_PUBLIC_KHUB_API_URL || 
    'https://nntuztaehnywdbttrajy.supabase.co/functions/v1/khub-query'
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenant_code: tenantCode,
      query,
      include_sources: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`KHub API error: ${response.status}`)
  }

  return response.json()
}
