"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "./supabase-browser";
import type { User } from "@supabase/supabase-js";

interface ClientAccess {
  partner_slug: string;
  client_slug: string;
  client_name: string;
}

interface AuthState {
  user: User | null;
  role: string | null;
  partnerSlug: string | null;
  isAdmin: boolean;
  displayName: string | null;
  clients: ClientAccess[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; noRole?: boolean }>;
  signOut: () => Promise<void>;
  canAccess: (partner: string, client?: string) => boolean;
}

const AuthContext = createContext<AuthState>({
  user: null, role: null, partnerSlug: null, isAdmin: false,
  displayName: null, clients: [], loading: true,
  signIn: async () => ({ error: null, noRole: false }),
  signOut: async () => {},
  canAccess: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [partnerSlug, setPartnerSlug] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  async function loadRole(accessToken?: string): Promise<boolean> {
    try {
      let token = accessToken;
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }
      if (!token) {
        console.warn("[Auth] loadRole: no token");
        return false;
      }

      const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "") + "/rest/v1/rpc/fn_bmp_get_my_role";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      const data = await res.json();

      if (data?.authorized) {
        setRole(data.role);
        setPartnerSlug(data.partner_slug);
        setIsAdmin(data.is_admin);
        setDisplayName(data.display_name);
        setClients(data.clients || []);
        return true;
      } else {
        setRole(null); setPartnerSlug(null); setIsAdmin(false);
        setDisplayName(null); setClients([]);
        return false;
      }
    } catch (err) {
      console.error("[Auth] loadRole error:", err);
      setRole(null); setPartnerSlug(null); setIsAdmin(false);
      setDisplayName(null); setClients([]);
      return false;
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") { setLoading(false); return; }

    let mounted = true;

    // 안전장치: 8초 후에도 로딩이면 강제 해제
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[Auth] Loading timeout - force release");
        setLoading(false);
      }
    }, 8000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await loadRole(session.access_token);
      } else {
        setUser(null);
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadRole(session.access_token);
        } else {
          setRole(null);
          setPartnerSlug(null);
          setIsAdmin(false);
          setDisplayName(null);
          setClients([]);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message, noRole: false };
    // 로그인 결과에서 토큰 직접 추출 → getSession 대기 없이 즉시 RPC 호출
    setUser(data.session?.user ?? null);
    const token = data.session?.access_token;
    const hasRole = await loadRole(token);
    return { error: null, noRole: !hasRole };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setPartnerSlug(null);
    setIsAdmin(false);
    setClients([]);
  }

  function canAccess(partner: string, client?: string): boolean {
    if (!user || !role) return false;
    if (isAdmin) return true;
    if (partnerSlug !== partner) return false;
    if (client) {
      return clients.some(c => c.partner_slug === partner && c.client_slug === client);
    }
    return true;
  }

  return (
    <AuthContext.Provider value={{
      user, role, partnerSlug, isAdmin, displayName, clients, loading,
      signIn, signOut, canAccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
