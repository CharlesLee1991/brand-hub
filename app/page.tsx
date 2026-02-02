'use client'

import Link from 'next/link'
import { Building2, MessageSquare, Zap, Shield, ArrowRight } from 'lucide-react'

const partners = [
  {
    code: 'mprd',
    name: '엠피알디',
    description: 'PR/마케팅 전문 기업',
    color: 'from-blue-500 to-blue-600',
  },
  {
    code: 'hamshout',
    name: '함샤우트글로벌',
    description: '글로벌 PR 커뮤니케이션',
    color: 'from-purple-500 to-purple-600',
  },
]

const features = [
  {
    icon: MessageSquare,
    title: 'AI 지식 어시스턴트',
    description: '회사 정보를 학습한 AI가 24시간 질문에 답변합니다.',
  },
  {
    icon: Zap,
    title: '실시간 동기화',
    description: 'Notion에 정보 업데이트하면 자동으로 AI에 반영됩니다.',
  },
  {
    icon: Shield,
    title: '브랜드 일관성',
    description: '승인된 정보만 전달하여 브랜드 메시지를 보호합니다.',
  },
  {
    icon: Building2,
    title: 'GEOcare 연동',
    description: 'AI 검색 최적화 데이터와 연계된 인사이트를 제공합니다.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-xl">Brand Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://geo-platform.lovable.app" 
              target="_blank"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              GEOcare →
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>GEOcare Premium 파일럿</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            AI가 학습한<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              브랜드 지식 허브
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            회사 정보를 Notion에 정리하면, AI가 학습하여
            <br />고객과 파트너에게 정확한 정보를 전달합니다.
          </p>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">파일럿 파트너사</h2>
          <p className="text-gray-600 text-center mb-10">
            아래 파트너사의 AI 어시스턴트를 체험해보세요
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {partners.map((partner) => (
              <Link
                key={partner.code}
                href={`/${partner.code}`}
                className="group block"
              >
                <div className="border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${partner.color} flex items-center justify-center mb-4`}>
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                    {partner.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{partner.description}</p>
                  <div className="flex items-center text-blue-600 font-medium">
                    <span>AI 어시스턴트 체험</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">주요 기능</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4 p-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            우리 회사도 AI 지식 허브를 만들고 싶다면?
          </h2>
          <p className="mb-8 opacity-90">
            GEOcare Premium 파일럿 프로그램에 참여하세요
          </p>
          <a
            href="mailto:contact@geocare.ai"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            <span>문의하기</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <span className="font-semibold">Brand Hub</span>
            <span className="text-gray-400">by GEOcare</span>
          </div>
          <div className="text-sm text-gray-500">
            © 2025 GEOcare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
