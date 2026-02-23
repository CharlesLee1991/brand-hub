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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  canAccess: (partner: string, client?: string) => boolean;
}

const AuthContext = createContext<AuthState>({
  user: null, role: null, partnerSlug: null, isAdmin: false,
  displayName: null, clients: [], loading: true,
  signIn: async () => ({ error: null }),
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

  async function loadRole() {
    const { data, error } = await supabase.rpc("fn_bmp_get_my_role");
    if (!error && data?.authorized) {
      setRole(data.role);
      setPartnerSlug(data.partner_slug);
      setIsAdmin(data.is_admin);
      setDisplayName(data.display_name);
      setClients(data.clients || []);
    } else {
      setRole(null);
      setPartnerSlug(null);
      setIsAdmin(false);
      setDisplayName(null);
      setClients([]);
    }
  }

  useEffect(() => {
    // SSR 또는 env 미설정 시 스킵
    if (typeof window === "undefined") { setLoading(false); return; }

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadRole().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    // 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadRole();
        } else {
          setRole(null);
          setPartnerSlug(null);
          setIsAdmin(false);
          setDisplayName(null);
          setClients([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
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
