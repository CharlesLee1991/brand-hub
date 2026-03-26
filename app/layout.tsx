import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'bmp.ai — AI 기반 브랜드 매니지먼트 플랫폼',
  description: 'GEOcare와 연동된 AI 기반 브랜드 커뮤니케이션 플랫폼. E-E-A-T 진단, Citation Moat, SoM 분석.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          as="style"
        />
      </head>
      <body className="font-sans antialiased bg-[#0A0E1A] text-[#F0F2F8]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
