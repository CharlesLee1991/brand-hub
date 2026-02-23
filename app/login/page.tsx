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

  // 파트너 모드 감지: 서브도메인 또는 ?partner= 쿼리
  const [partnerMode, setPartnerMode] = useState<string | null>(null);

  useEffect(() => {
    // 1) 쿼리 파라미터에서 partner 확인
    const params = new URLSearchParams(window.location.search);
    const qp = params.get("partner");
    if (qp) { setPartnerMode(qp); return; }

    // 2) 서브도메인에서 partner 추출
    const host = window.location.hostname;
    const bases = ["bmp.ai", "brand-hub-six.vercel.app"];
    for (const base of bases) {
      if (host.endsWith("." + base)) {
        const sub = host.replace("." + base, "").split(".").pop();
        if (sub && sub !== "www") { setPartnerMode(sub); return; }
      }
    }
    // 메인 도메인 → admin 모드 (partnerMode = null)
  }, []);

  const PARTNER_NAMES: Record<string, string> = {
    hahmshout: "함샤우트글로벌",
    mplanit: "엠플랫잇",
    frameout: "프레임아웃",
    mprd: "mprd",
  };

  // 이미 로그인 → 적절한 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && user && role) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect) {
        router.replace(redirect);
      } else if (partnerMode && partnerSlug === partnerMode) {
        router.replace("/" + partnerMode);
      } else if (isAdmin) {
        router.replace("/");
      } else if (partnerSlug) {
        router.replace("/" + partnerSlug);
      }
    }
  }, [loading, user, role, isAdmin, partnerSlug, partnerMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNoRole(false);
    setSubmitting(true);

    try {
      // admin 모드: bizspring.co.kr 이메일만 허용
      if (!partnerMode && !email.endsWith("@bizspring.co.kr")) {
        setError("관리자 계정(@bizspring.co.kr)만 로그인할 수 있습니다.");
        setSubmitting(false);
        return;
      }

      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error.includes("Invalid login")
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : result.error);
        setSubmitting(false);
        return;
      }

      if (result.noRole) {
        setNoRole(true);
        setSubmitting(false);
        return;
      }

      // 파트너 모드에서 다른 파트너 계정 차단 (admin은 어디서나 OK)
      // signIn 후 auth-context에 role/partnerSlug가 set되었으므로 직접 체크 불가
      // → window.location으로 이동 후 페이지 레벨에서 canAccess가 체크함

      // 성공 → redirect
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect) {
        window.location.href = redirect;
      } else if (partnerMode) {
        window.location.href = "/" + partnerMode;
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
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
          <p className="text-sm text-gray-400 mt-1">
            {partnerMode
              ? (PARTNER_NAMES[partnerMode] || partnerMode) + " 전용"
              : "관리자 로그인"}
          </p>
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
                  placeholder={partnerMode ? "name@company.com" : "admin@bizspring.co.kr"}
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
