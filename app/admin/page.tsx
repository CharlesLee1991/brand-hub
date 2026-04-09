"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Loader2, Shield, Plus, Play, RefreshCw, ExternalLink,
  ToggleLeft, ToggleRight, ArrowLeft, CheckCircle2, AlertCircle,
  LayoutDashboard, Users, Building2, KeyRound, Globe, Package, BarChart3,
} from "lucide-react";

type Tab = "dashboard" | "partners" | "clients" | "accounts" | "brandhub" | "pdp" | "analytics";
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nntuztaehnywdbttrajy.supabase.co";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const API = "/api/pdp-admin";

async function sq(path: string) {
  const r = await fetch(SUPA + "/rest/v1/" + path, { headers: { apikey: ANON, Authorization: "Bearer " + ANON } });
  return r.ok ? r.json() : [];
}

export default function AdminPage() {
  const { user, loading: authLoading, isAdmin, signOut, displayName } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const flash = (type: "ok" | "err", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;
  if (!user || !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]"><div className="text-center">
      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
      <p className="text-sm text-gray-500 mb-4">슈퍼어드민만 접근할 수 있습니다.</p>
      <a href="/" className="text-sm text-blue-600 hover:underline">← 메인으로</a>
    </div></div>
  );

  const tabs: { key: Tab; icon: typeof LayoutDashboard; label: string }[] = [
    { key: "dashboard", icon: LayoutDashboard, label: "대시보드" },
    { key: "partners", icon: Users, label: "파트너" },
    { key: "clients", icon: Building2, label: "고객" },
    { key: "accounts", icon: KeyRound, label: "계정/권한" },
    { key: "brandhub", icon: Globe, label: "Brand Hub" },
    { key: "pdp", icon: Package, label: "PDP JSON-LD" },
    { key: "analytics", icon: BarChart3, label: "분석" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-gray-600 transition"><ArrowLeft className="w-4 h-4" /></a>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm text-white bg-gradient-to-br from-blue-600 to-blue-800">B</div>
            <div><div className="font-bold text-gray-900 text-sm">bmp.ai Admin</div><div className="text-[10px] text-gray-400">Brand Management Platform</div></div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">Admin</span>
            <span className="text-gray-500">{displayName || user?.email}</span>
            <button onClick={() => signOut()} className="text-gray-400 hover:text-gray-600 text-xs">로그아웃</button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={"flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition rounded-t " + (tab === key ? "text-blue-600 border-b-2 border-blue-600 -mb-[1px]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50")}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
        {msg && <div className={"mb-4 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 " + (msg.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
          {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{msg.text}
        </div>}
        {tab === "dashboard" && <DashboardTab />}
        {tab === "partners" && <PartnersTab />}
        {tab === "clients" && <ClientsTab />}
        {tab === "accounts" && <AccountsTab />}
        {tab === "brandhub" && <BrandHubTab />}
        {tab === "pdp" && <PdpTab flash={flash} />}
        {tab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
}

/* ═══ Dashboard ═══ */
function DashboardTab() {
  const [d, setD] = useState<Record<string, number>>({});
  useEffect(() => {
    Promise.all([
      sq("gp_geobh_hub_config?select=hub_slug").then(r => ({ partners: r.length })),
      sq("bmp_partner_clients?select=id").then(r => ({ clients: r.length })),
      sq("bmp_user_roles?select=id").then(r => ({ accounts: r.length })),
      sq("bmp_brandhub_sites?select=site_id").then(r => ({ hubs: r.length })),
      sq("bmp_jsonld_sites?select=id").then(r => ({ pdp_sites: r.length })),
      sq("bmp_jsonld_delivery?select=id&is_active=is.true").then(r => ({ delivery: r.length })),
      sq("bmp_eeat_scores?select=id").then(r => ({ eeat: r.length })),
      sq("bmp_jsonld_extractions?select=id").then(r => ({ extractions: r.length })),
    ]).then(results => { const m: Record<string, number> = {}; results.forEach(r => Object.assign(m, r)); setD(m); });
  }, []);
  const cards = [
    { label: "파트너", value: d.partners, color: "text-blue-600" },
    { label: "고객사", value: d.clients, color: "text-emerald-600" },
    { label: "사용자", value: d.accounts, color: "text-purple-600" },
    { label: "Brand Hub", value: d.hubs, color: "text-amber-600" },
    { label: "PDP 사이트", value: d.pdp_sites, color: "text-red-600" },
    { label: "JSON-LD 서빙", value: d.delivery, color: "text-teal-600" },
    { label: "EEAT 분석", value: d.eeat, color: "text-pink-600" },
    { label: "PDP 추출", value: d.extractions, color: "text-orange-600" },
  ];
  return (<div><h2 className="font-bold text-gray-900 mb-4">전체 현황</h2>
    <div className="grid grid-cols-4 gap-4">{cards.map(c => (
      <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="text-xs text-gray-500 mb-1">{c.label}</div>
        <div className={"text-3xl font-bold " + c.color}>{c.value ?? "—"}</div>
      </div>
    ))}</div>
  </div>);
}

/* ═══ Partners ═══ */
function PartnersTab() {
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [ld, setLd] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pf, setPf] = useState({ hub_slug: "", brand_name: "", brand_description: "", primary_color: "#3B82F6" });
  const load = () => sq("gp_geobh_hub_config?select=hub_slug,brand_name,brand_description,primary_color&order=hub_slug").then(d => { setRows(d); setLd(false); });
  useEffect(() => { load(); }, []);
  const handleAddPartner = async () => {
    if (!pf.hub_slug || !pf.brand_name) return;
    setSaving(true);
    try {
      await fetch(SUPA + "/rest/v1/gp_geobh_hub_config", { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ ...pf, hub_enabled: true, site_domain: "https://" + pf.hub_slug + ".bmp.ai" }) });
      setPf({ hub_slug: "", brand_name: "", brand_description: "", primary_color: "#3B82F6" }); setShowAdd(false); load();
    } catch (_) {} finally { setSaving(false); }
  };
  return (<div>
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-gray-900">파트너 관리 ({rows.length})</h2>
      <button onClick={()=>setShowAdd(!showAdd)} className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded-lg flex items-center gap-1.5 hover:bg-gray-800"><Plus className="w-3.5 h-3.5" /> 파트너 추가</button>
    </div>
    {showAdd && (
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 mb-4 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div><label className="block text-xs text-gray-500 mb-1">슬러그*</label><input value={pf.hub_slug} onChange={e=>setPf({...pf,hub_slug:e.target.value})} placeholder="partnername" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">브랜드명*</label><input value={pf.brand_name} onChange={e=>setPf({...pf,brand_name:e.target.value})} placeholder="파트너명" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">설명</label><input value={pf.brand_description} onChange={e=>setPf({...pf,brand_description:e.target.value})} placeholder="한줄 설명" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">색상</label><input type="color" value={pf.primary_color} onChange={e=>setPf({...pf,primary_color:e.target.value})} className="h-9 w-full border rounded-lg cursor-pointer" /></div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={()=>setShowAdd(false)} className="px-3 py-1.5 text-sm text-gray-600 border rounded-lg">취소</button>
          <button onClick={handleAddPartner} disabled={saving||!pf.hub_slug||!pf.brand_name} className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded-lg disabled:opacity-50">{saving?"저장 중...":"저장"}</button>
        </div>
      </div>
    )}
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {ld ? <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div> : (
        <table className="w-full text-sm"><thead><tr className="border-b bg-gray-50/50">
          <th className="text-left py-2.5 px-4 text-xs text-gray-500">Slug</th><th className="text-left py-2.5 px-4 text-xs text-gray-500">이름</th>
          <th className="text-left py-2.5 px-4 text-xs text-gray-500">설명</th><th className="text-left py-2.5 px-4 text-xs text-gray-500">색상</th>
          <th className="text-left py-2.5 px-4 text-xs text-gray-500">링크</th>
        </tr></thead><tbody>{rows.map(r => (
          <tr key={r.hub_slug} className="border-b border-gray-50 hover:bg-blue-50/30">
            <td className="py-3 px-4 font-mono text-xs">{r.hub_slug}</td>
            <td className="py-3 px-4 font-medium text-gray-900">{r.brand_name}</td>
            <td className="py-3 px-4 text-gray-500 text-xs max-w-xs truncate">{(r.brand_description || "").substring(0, 50)}</td>
            <td className="py-3 px-4"><span className="w-5 h-5 rounded inline-block" style={{ backgroundColor: r.primary_color || "#ccc" }} /></td>
            <td className="py-3 px-4"><a href={"https://" + r.hub_slug + ".bmp.ai"} target="_blank" rel="noopener" className="text-blue-600 hover:underline text-xs flex items-center gap-1">{r.hub_slug}.bmp.ai <ExternalLink className="w-3 h-3" /></a></td>
          </tr>
        ))}</tbody></table>
      )}
    </div>
  </div>);
}

/* ═══ Clients ═══ */
function ClientsTab() {
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [ld, setLd] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ partner_slug: "", client_slug: "", client_name: "", client_url: "", client_industry: "" });
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const load = () => sq("bmp_partner_clients?select=partner_slug,client_slug,client_name,client_url,client_industry,status,site_mode&order=partner_slug,client_slug").then(d => { setRows(d); setLd(false); });
  useEffect(() => { load(); }, []);
  const handleAdd = async () => {
    if (!form.partner_slug || !form.client_slug || !form.client_name) return;
    setSaving(true);
    try {
      await fetch(SB + "/rest/v1/bmp_partner_clients", { method: "POST", headers: { ...HD, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ ...form, status: "active", site_mode: "disabled" }) });
      setForm({ partner_slug: "", client_slug: "", client_name: "", client_url: "", client_industry: "" });
      setShowAdd(false); load();
    } catch (_) {} finally { setSaving(false); }
  };
  const handleEdit = async (slug: string) => {
    setSaving(true);
    try {
      await fetch(SB + "/rest/v1/bmp_partner_clients?client_slug=eq." + slug + "&status=eq.active", { method: "PATCH", headers: { ...HD, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ client_name: editForm.client_name, client_url: editForm.client_url, client_industry: editForm.client_industry, updated_at: new Date().toISOString() }) });
      setEditSlug(null); load();
    } catch (_) {} finally { setSaving(false); }
  };
  const handleToggle = async (slug: string, current: string) => {
    const next = current === "active" ? "inactive" : "active";
    await fetch(SB + "/rest/v1/bmp_partner_clients?client_slug=eq." + slug, { method: "PATCH", headers: { ...HD, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ status: next, updated_at: new Date().toISOString() }) });
    load();
  };
  return (<div>
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-gray-900">고객 관리 ({rows.length})</h2>
      <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded-lg flex items-center gap-1.5 hover:bg-gray-800"><Plus className="w-3.5 h-3.5" /> 고객 추가</button>
    </div>
    {showAdd && (
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 mb-4 space-y-3">
        <div className="grid grid-cols-5 gap-3">
          <div><label className="block text-xs text-gray-500 mb-1">파트너*</label><input value={form.partner_slug} onChange={e=>setForm({...form,partner_slug:e.target.value})} placeholder="hahmshout" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">슬러그*</label><input value={form.client_slug} onChange={e=>setForm({...form,client_slug:e.target.value})} placeholder="brandname" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">고객명*</label><input value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})} placeholder="브랜드명" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">URL</label><input value={form.client_url} onChange={e=>setForm({...form,client_url:e.target.value})} placeholder="https://..." className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">업종</label><input value={form.client_industry} onChange={e=>setForm({...form,client_industry:e.target.value})} placeholder="패션" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={()=>setShowAdd(false)} className="px-3 py-1.5 text-sm text-gray-600 border rounded-lg">취소</button>
          <button onClick={handleAdd} disabled={saving||!form.partner_slug||!form.client_slug||!form.client_name} className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded-lg disabled:opacity-50">{saving?"저장 중...":"저장"}</button>
        </div>
      </div>
    )}
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {ld ? <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div> : (
        <table className="w-full text-sm"><thead><tr className="border-b bg-gray-50/50">
          <th className="text-left py-2.5 px-4 text-xs text-gray-500">파트너</th><th className="text-left py-2.5 px-4 text-xs text-gray-500">고객명</th>
          <th className="text-left py-2.5 px-4 text-xs text-gray-500">URL</th><th className="text-left py-2.5 px-4 text-xs text-gray-500">업종</th>
          <th className="text-center py-2.5 px-4 text-xs text-gray-500">모드</th><th className="text-center py-2.5 px-4 text-xs text-gray-500">상태</th>
          <th className="text-center py-2.5 px-4 text-xs text-gray-500">액션</th>
        </tr></thead><tbody>{rows.map(r => {
          const isEdit = editSlug === r.client_slug;
          return (<tr key={r.partner_slug+r.client_slug} className="border-b border-gray-50 hover:bg-blue-50/30">
            <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{r.partner_slug}</span></td>
            <td className="py-3 px-4">{isEdit?<input value={editForm.client_name} onChange={e=>setEditForm({...editForm,client_name:e.target.value})} className="w-full px-2 py-1 border rounded text-sm"/>:<span className="font-medium text-gray-900">{r.client_name}</span>}</td>
            <td className="py-3 px-4">{isEdit?<input value={editForm.client_url} onChange={e=>setEditForm({...editForm,client_url:e.target.value})} className="w-full px-2 py-1 border rounded text-sm"/>:<span className="text-xs text-gray-400 max-w-[180px] truncate block">{r.client_url||"—"}</span>}</td>
            <td className="py-3 px-4">{isEdit?<input value={editForm.client_industry} onChange={e=>setEditForm({...editForm,client_industry:e.target.value})} className="w-full px-2 py-1 border rounded text-sm"/>:<span className="text-xs text-gray-500">{r.client_industry||"—"}</span>}</td>
            <td className="py-3 px-4 text-center"><span className={"px-1.5 py-0.5 rounded text-[10px] "+(r.site_mode==="brandhub"?"bg-blue-50 text-blue-600":r.site_mode==="gamma"?"bg-amber-50 text-amber-600":"bg-gray-50 text-gray-400")}>{r.site_mode||"—"}</span></td>
            <td className="py-3 px-4 text-center"><button onClick={()=>handleToggle(r.client_slug,r.status)} className={"px-2 py-0.5 rounded-full text-xs cursor-pointer "+(r.status==="active"?"bg-green-50 text-green-700 hover:bg-green-100":"bg-gray-100 text-gray-500 hover:bg-gray-200")}>{r.status}</button></td>
            <td className="py-3 px-4 text-center">{isEdit?(<span className="flex gap-1 justify-center"><button onClick={()=>handleEdit(r.client_slug)} className="text-xs text-blue-600 hover:underline">저장</button><button onClick={()=>setEditSlug(null)} className="text-xs text-gray-400 hover:underline">취소</button></span>):(<button onClick={()=>{setEditSlug(r.client_slug);setEditForm({client_name:r.client_name,client_url:r.client_url||"",client_industry:r.client_industry||""});}} className="text-xs text-gray-400 hover:text-blue-600">편집</button>)}</td>
          </tr>);
        })}</tbody></table>
      )}
    </div>
  </div>);
}

/* ═══ Accounts ═══ */
function AccountsTab() {
  const [rows, setRows] = useState<Array<Record<string, string | boolean>>>([]);
  const [ld, setLd] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [af, setAf] = useState({ email: "", display_name: "", role: "viewer", partner_slug: "" });
  const load = () => sq("bmp_user_roles?select=email,display_name,role,partner_slug,is_active&order=role,partner_slug,email").then(d => { setRows(d); setLd(false); });
  useEffect(() => { load(); }, []);
  const handleAddAccount = async () => {
    if (!af.email || !af.role) return; setSaving(true);
    try {
      await fetch(SB + "/rest/v1/bmp_user_roles", { method: "POST", headers: { ...HD, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ ...af, partner_slug: af.partner_slug || null, is_active: true }) });
      setAf({ email: "", display_name: "", role: "viewer", partner_slug: "" }); setShowAdd(false); load();
    } catch (_) {} finally { setSaving(false); }
  };
  const toggleActive = async (email: string, current: boolean) => {
    await fetch(SB + "/rest/v1/bmp_user_roles?email=eq." + encodeURIComponent(email), { method: "PATCH", headers: { ...HD, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ is_active: !current }) });
    load();
  };
  return (<div>
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-gray-900">계정/권한 ({rows.length})</h2>
      <button onClick={()=>setShowAdd(!showAdd)} className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded-lg flex items-center gap-1.5 hover:bg-gray-800"><Plus className="w-3.5 h-3.5" /> 계정 추가</button>
    </div>
    {showAdd && (
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 mb-4 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div><label className="block text-xs text-gray-500 mb-1">이메일*</label><input value={af.email} onChange={e=>setAf({...af,email:e.target.value})} placeholder="user@example.com" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">이름</label><input value={af.display_name} onChange={e=>setAf({...af,display_name:e.target.value})} placeholder="홍길동" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">역할*</label><select value={af.role} onChange={e=>setAf({...af,role:e.target.value})} className="w-full px-3 py-1.5 border rounded-lg text-sm"><option value="admin">admin</option><option value="editor">editor</option><option value="viewer">viewer</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">파트너</label><input value={af.partner_slug} onChange={e=>setAf({...af,partner_slug:e.target.value})} placeholder="(내부=빈칸)" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={()=>setShowAdd(false)} className="px-3 py-1.5 text-sm text-gray-600 border rounded-lg">취소</button>
          <button onClick={handleAddAccount} disabled={saving||!af.email} className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded-lg disabled:opacity-50">{saving?"저장 중...":"저장"}</button>
        </div>
      </div>
    )}
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {ld ? <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div> : (
        <table className="w-full text-sm"><thead><tr className="border-b bg-gray-50/50">
          <th className="text-left py-2.5 px-4 text-xs text-gray-500">이메일</th><th className="text-left py-2.5 px-4 text-xs text-gray-500">이름</th>
          <th className="text-left py-2.5 px-4 text-xs text-gray-500">역할</th><th className="text-left py-2.5 px-4 text-xs text-gray-500">파트너</th>
          <th className="text-center py-2.5 px-4 text-xs text-gray-500">활성</th>
        </tr></thead><tbody>{rows.map(r => (
          <tr key={String(r.email)} className="border-b border-gray-50 hover:bg-blue-50/30">
            <td className="py-3 px-4 font-mono text-xs">{String(r.email)}</td>
            <td className="py-3 px-4 text-gray-900">{String(r.display_name || "—")}</td>
            <td className="py-3 px-4"><span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (r.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700")}>{String(r.role)}</span></td>
            <td className="py-3 px-4 text-xs text-gray-500">{String(r.partner_slug || "— (내부)")}</td>
            <td className="py-3 px-4 text-center"><button onClick={()=>toggleActive(String(r.email),!!r.is_active)} className="cursor-pointer" title={r.is_active?"비활성화":"활성화"}>{r.is_active ? <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block hover:bg-green-600" /> : <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block hover:bg-gray-400" />}</button></td>
          </tr>
        ))}</tbody></table>
      )}
    </div>
  </div>);
}

/* ═══ Brand Hub ═══ */
function BrandHubTab() {
  const [hubs, setHubs] = useState<Array<Record<string, string>>>([]);
  const [slugs, setSlugs] = useState<Array<Record<string, string>>>([]);
  const [ld, setLd] = useState(true);
  useEffect(() => {
    Promise.all([
      sq("gp_geobh_hub_config?select=hub_slug,brand_name,primary_color&order=hub_slug"),
      sq("bmp_domain_reserved_slugs?select=slug,category,reason&order=category,slug&limit=30"),
    ]).then(([h, s]) => { setHubs(h); setSlugs(s); setLd(false); });
  }, []);
  return (<div>
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-gray-900">Brand Hub 관리</h2>
      <button className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded-lg flex items-center gap-1.5 opacity-50 cursor-not-allowed"><Plus className="w-3.5 h-3.5" /> Hub 생성 (준비 중)</button>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="font-semibold text-sm mb-3">활성 Hub ({hubs.length})</h3>
        {ld ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : (
          <div className="space-y-2 max-h-96 overflow-y-auto">{hubs.map(h => (
            <div key={h.hub_slug} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <span className="w-4 h-4 rounded" style={{ backgroundColor: h.primary_color || "#ccc" }} />
              <div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-900 truncate">{h.brand_name}</div><div className="text-xs text-gray-400">{h.hub_slug}.bmp.ai</div></div>
              <a href={"https://" + h.hub_slug + ".bmp.ai"} target="_blank" rel="noopener" className="text-gray-400 hover:text-blue-600"><ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
          ))}</div>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="font-semibold text-sm mb-3">예약 슬러그 (상위 30건 / 총 106)</h3>
        {ld ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : (
          <div className="space-y-1 max-h-96 overflow-y-auto">{slugs.map(s => (
            <div key={s.slug} className="flex items-center gap-2 text-xs py-0.5">
              <span className={"px-1.5 py-0.5 rounded text-[10px] font-medium " + (s.category === "system" ? "bg-red-50 text-red-600" : s.category === "partner" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-600")}>{s.category}</span>
              <span className="font-mono text-gray-700">{s.slug}</span>
              <span className="text-gray-400 truncate">{s.reason}</span>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  </div>);
}

/* ═══ PDP JSON-LD ═══ */
interface SiteRow { id: string; site_domain: string; is_pdp_enabled: boolean; pdp_source: string; schedule_interval: string; bmp_jsonld_urls?: { count: number }[]; }
interface UrlRow { id: string; product_url: string; status: string; last_extracted_at: string | null; error_message: string | null; }

function PdpTab({ flash }: { flash: (t: "ok"|"err", m: string) => void }) {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [sel, setSel] = useState<SiteRow | null>(null);
  const [urls, setUrls] = useState<UrlRow[]>([]);
  const [ld, setLd] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showUrls, setShowUrls] = useState(false);
  const [nd, setNd] = useState(""); const [ns, setNs] = useState("auto"); const [nsc, setNsc] = useState("24h");
  const [nu, setNu] = useState("");

  const load = useCallback(async () => {
    setLd(true);
    const [d1, d2] = await Promise.all([fetch(API+"?action=dashboard").then(r=>r.json()), fetch(API+"?action=sites").then(r=>r.json())]);
    if (d1.success) setStats(d1.stats); if (d2.success) setSites(d2.sites||[]);
    setLd(false);
  }, []);
  const loadU = async (s: SiteRow) => { setSel(s); setLd(true); const d = await fetch(API+"?action=urls&site_id="+s.id).then(r=>r.json()); if(d.success) setUrls(d.urls||[]); setLd(false); };
  useEffect(() => { load(); }, [load]);

  const addSite = async () => { if(!nd.trim()) return; const d = await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add_site",site_domain:nd.trim().replace(/^https?:\/\//,"").replace(/\/$/,""),pdp_source:ns,schedule_interval:nsc})}).then(r=>r.json()); if(d.success){flash("ok","추가 완료");setNd("");setShowAdd(false);load();}else flash("err","실패"); };
  const toggle = async (s: SiteRow) => { const d = await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"toggle_site",site_id:s.id,is_pdp_enabled:!s.is_pdp_enabled})}).then(r=>r.json()); if(d.success){flash("ok",s.site_domain+(s.is_pdp_enabled?" OFF":" ON"));load();} };
  const addU = async () => { if(!sel||!nu.trim()) return; const list=nu.split("\n").map(u=>u.trim()).filter(u=>u.startsWith("http")); if(!list.length){flash("err","URL 없음");return;} const d=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add_urls",site_id:sel.id,urls:list})}).then(r=>r.json()); if(d.success){flash("ok",d.added+"건 추가");setNu("");setShowUrls(false);loadU(sel);} };
  const batch = async () => { flash("ok","배치 실행 중..."); const d=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"trigger_batch"})}).then(r=>r.json()); if(d.success){flash("ok","완료: "+(d.batch_result?.processed||0)+"건");load();if(sel)loadU(sel);}else flash("err","실패"); };
  const sc = (s: string) => s==="success"?"bg-green-100 text-green-800":s==="pending"?"bg-yellow-100 text-yellow-800":s==="failed"?"bg-red-100 text-red-800":"bg-gray-100 text-gray-600";

  return (<div>
    <div className="grid grid-cols-4 gap-3 mb-4">{[["사이트",stats.total_sites],["활성",stats.active_sites],["Delivery",stats.delivery_cached],["추출",stats.total_extractions]].map(([l,v])=>(
      <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-3"><div className="text-xs text-gray-500">{String(l)}</div><div className="text-2xl font-bold text-gray-900">{v??"—"}</div></div>
    ))}</div>
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-bold text-gray-900 text-sm">{sel?sel.site_domain+" — URL":"PDP 사이트"}</h2>
      <div className="flex gap-2">
        {sel&&<button onClick={()=>{setSel(null);setUrls([]);}} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg">← 목록</button>}
        <button onClick={load} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3"/>새로고침</button>
        <button onClick={batch} className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg flex items-center gap-1"><Play className="w-3 h-3"/>배치</button>
        {!sel&&<button onClick={()=>setShowAdd(!showAdd)} className="px-3 py-1.5 text-xs text-white bg-gray-900 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3"/>사이트</button>}
        {sel&&<button onClick={()=>setShowUrls(!showUrls)} className="px-3 py-1.5 text-xs text-white bg-gray-900 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3"/>URL</button>}
      </div>
    </div>
    {showAdd&&<div className="bg-white rounded-xl border p-4 mb-3"><div className="flex gap-2 items-end">
      <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">도메인</label><input value={nd} onChange={e=>setNd(e.target.value)} placeholder="example.com" className="w-full px-3 py-1.5 border rounded-lg text-sm"/></div>
      <div><label className="block text-xs text-gray-500 mb-1">소스</label><select value={ns} onChange={e=>setNs(e.target.value)} className="px-2 py-1.5 border rounded-lg text-sm"><option value="auto">자동</option><option value="coupang_scraper">쿠팡</option><option value="web_unlocker">WU</option><option value="manual">수동</option></select></div>
      <div><label className="block text-xs text-gray-500 mb-1">스케줄</label><select value={nsc} onChange={e=>setNsc(e.target.value)} className="px-2 py-1.5 border rounded-lg text-sm"><option value="manual">수동</option><option value="6h">6h</option><option value="12h">12h</option><option value="24h">24h</option></select></div>
      <button onClick={addSite} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">추가</button>
      <button onClick={()=>setShowAdd(false)} className="px-3 py-1.5 bg-gray-100 text-sm rounded-lg">취소</button>
    </div></div>}
    {showUrls&&sel&&<div className="bg-white rounded-xl border p-4 mb-3">
      <textarea value={nu} onChange={e=>setNu(e.target.value)} placeholder="https://... (줄바꿈)" rows={3} className="w-full px-3 py-2 border rounded-lg text-sm font-mono mb-2"/>
      <div className="flex gap-2"><button onClick={addU} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">추가</button><button onClick={()=>setShowUrls(false)} className="px-3 py-1.5 bg-gray-100 text-sm rounded-lg">취소</button></div>
    </div>}
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {ld?<div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto"/></div>:
       !sel?(
        <table className="w-full text-sm"><thead><tr className="border-b bg-gray-50/50"><th className="text-left py-2 px-4 text-xs text-gray-500">도메인</th><th className="text-left py-2 px-4 text-xs text-gray-500">소스</th><th className="text-left py-2 px-4 text-xs text-gray-500">스케줄</th><th className="text-left py-2 px-4 text-xs text-gray-500">URL</th><th className="text-center py-2 px-4 text-xs text-gray-500">상태</th></tr></thead>
        <tbody>{sites.map(s=>(
          <tr key={s.id} className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer" onClick={()=>loadU(s)}>
            <td className="py-2.5 px-4 font-medium">{s.site_domain}</td>
            <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100">{s.pdp_source}</span></td>
            <td className="py-2.5 px-4 text-gray-500">{s.schedule_interval}</td>
            <td className="py-2.5 px-4">{s.bmp_jsonld_urls?.[0]?.count||0}건</td>
            <td className="py-2.5 px-4 text-center" onClick={e=>{e.stopPropagation();toggle(s);}}>
              {s.is_pdp_enabled?<ToggleRight className="w-5 h-5 text-blue-600 mx-auto cursor-pointer"/>:<ToggleLeft className="w-5 h-5 text-gray-300 mx-auto cursor-pointer"/>}
            </td>
          </tr>
        ))}</tbody></table>
      ):(
        <table className="w-full text-sm"><thead><tr className="border-b bg-gray-50/50"><th className="text-left py-2 px-4 text-xs text-gray-500">URL</th><th className="text-left py-2 px-4 text-xs text-gray-500">상태</th><th className="text-left py-2 px-4 text-xs text-gray-500">추출일</th><th className="text-left py-2 px-4 text-xs text-gray-500">에러</th></tr></thead>
        <tbody>{urls.map(u=>(
          <tr key={u.id} className="border-b border-gray-50">
            <td className="py-2.5 px-4 text-xs max-w-[300px] truncate"><a href={u.product_url} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{u.product_url.replace(/^https?:\/\//,"").substring(0,60)}</a></td>
            <td className="py-2.5 px-4"><span className={"px-2 py-0.5 rounded-full text-xs "+sc(u.status)}>{u.status}</span></td>
            <td className="py-2.5 px-4 text-xs text-gray-400">{u.last_extracted_at?new Date(u.last_extracted_at).toLocaleString("ko-KR"):"—"}</td>
            <td className="py-2.5 px-4 text-xs text-red-400 max-w-[150px] truncate">{u.error_message||"—"}</td>
          </tr>
        ))}</tbody></table>
      )}
    </div>
  </div>);
}

/* ═══ Analytics ═══ */
function AnalyticsTab() {
  const [eeat, setEeat] = useState<Array<Record<string, string | number>>>([]);
  const [ld, setLd] = useState(true);
  useEffect(() => { sq("bmp_eeat_scores?select=client_slug,overall_score,overall_grade,experience,expertise,authoritativeness,trustworthiness,created_at&order=created_at.desc&limit=30").then(d=>{setEeat(d);setLd(false);}); }, []);
  const gc = (g: string) => g==="A"?"text-emerald-600":g==="B"?"text-blue-600":g==="C"?"text-yellow-600":"text-red-600";
  return (<div>
    <h2 className="font-bold text-gray-900 mb-4">분석 모니터링</h2>
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50/50"><h3 className="font-semibold text-sm">EEAT 최근 결과 ({eeat.length}건)</h3></div>
      {ld?<div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto"/></div>:(
        <table className="w-full text-sm"><thead><tr className="border-b">
          <th className="text-left py-2 px-4 text-xs text-gray-500">고객</th>
          <th className="text-center py-2 px-4 text-xs text-gray-500">등급</th>
          <th className="text-center py-2 px-4 text-xs text-gray-500">총점</th>
          <th className="text-center py-2 px-4 text-xs text-gray-500">Exp</th>
          <th className="text-center py-2 px-4 text-xs text-gray-500">Exp</th>
          <th className="text-center py-2 px-4 text-xs text-gray-500">Auth</th>
          <th className="text-center py-2 px-4 text-xs text-gray-500">Trust</th>
          <th className="text-left py-2 px-4 text-xs text-gray-500">일시</th>
        </tr></thead><tbody>{eeat.map((r,i)=>(
          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
            <td className="py-2.5 px-4 font-medium text-gray-900">{r.client_slug}</td>
            <td className={"py-2.5 px-4 text-center font-bold "+gc(String(r.overall_grade))}>{r.overall_grade}</td>
            <td className="py-2.5 px-4 text-center font-mono">{r.overall_score}</td>
            <td className="py-2.5 px-4 text-center text-xs">{r.experience}</td>
            <td className="py-2.5 px-4 text-center text-xs">{r.expertise}</td>
            <td className="py-2.5 px-4 text-center text-xs">{r.authoritativeness}</td>
            <td className="py-2.5 px-4 text-center text-xs">{r.trustworthiness}</td>
            <td className="py-2.5 px-4 text-xs text-gray-400">{r.created_at?new Date(String(r.created_at)).toLocaleDateString("ko-KR"):"—"}</td>
          </tr>
        ))}</tbody></table>
      )}
    </div>
  </div>);
}
