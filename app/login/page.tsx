"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, signOut, isAdmin, partnerSlug, clients, role } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [noRole, setNoRole] = useState(false);

  // 이미 로그인 → 적절한 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && user) {
      if (role) {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        if (redirect) {
          router.replace(redirect);
        } else if (isAdmin) {
          router.replace("/");
        } else if (partnerSlug) {
          router.replace("/" + partnerSlug);
        }
      } else {
        // 로그인 됐지만 역할 미할당 → 안내
        setNoRole(true);
        setSubmitting(false);
      }
    }
  }, [loading, user, role, isAdmin, partnerSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNoRole(false);
    setSubmitting(true);

    const result = await signIn(email, password);
    if (result.error) {
      if (result.error.includes("Invalid login")) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setError(result.error);
      }
      setSubmitting(false);
      return;
    }

    // 로그인 성공했지만 역할 없음
    if (result.noRole) {
      setNoRole(true);
      setSubmitting(false);
      return;
    }

    // 역할 있음 → useEffect에서 리다이렉트 처리
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <span className="text-2xl font-black text-white">B</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Brand Hub</h1>
          <p className="text-sm text-gray-400 mt-1">파트너 전용 GEO 분석 플랫폼</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="partner@company.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {noRole && (
              <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
                <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  접근 권한이 없습니다
                </div>
                <p className="text-amber-600 text-xs leading-relaxed">
                  로그인은 성공했지만 Brand Hub 접근 권한이 할당되지 않았습니다.
                </p>
                <p className="text-amber-500 text-[10px] mt-1 font-mono">
                  {user?.email || "no-user"} | role={role || "null"}
                </p>
                <button
                  type="button"
                  onClick={() => { signOut(); setNoRole(false); setError(null); }}
                  className="mt-2 text-xs text-amber-700 underline hover:text-amber-900"
                >
                  다른 계정으로 로그인
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  로그인
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            계정이 없으신가요? 관리자에게 문의하세요.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Powered by <span className="text-gray-400 font-medium">BizSpring</span> × GEOcare.AI
        </p>
      </div>
    </div>
  );
}
