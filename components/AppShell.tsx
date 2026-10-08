"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, CalendarDays, CarFront, ChevronDown, ClipboardList, FileText, LayoutDashboard,
  MessageCircle, Search, Settings, Sparkles, TrendingUp, Users, Wrench, UserPlus
} from "lucide-react";
import LanguageSwitch from "./LanguageSwitch";
import LegacyIntelligencePanel from "./LegacyIntelligencePanel";
import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

const navGroups = [
  { label: "operations", items: [
    ["dashboard", "/dashboard", LayoutDashboard],
    ["collision", "/collision-center", Wrench],
    ["repair", "/repair-board", ClipboardList],
  ]},
  { label: "customersGroup", items: [
    ["leads", "/leads", UserPlus],
    ["conversations", "/conversations", MessageCircle],
    ["estimates", "/estimates", FileText],
    ["calendar", "/calendar", CalendarDays],
    ["customers", "/customers", Users],
    ["vehicles", "/vehicles", CarFront],
  ]},
  { label: "business", items: [
    ["growth", "/growth", TrendingUp],
  ]},
] as const;

const copy = {
  en: {
    nav: { dashboard:"Dashboard", leads:"Leads", collision:"Collision Center", customers:"Customers", vehicles:"Vehicles", estimates:"Estimates", repair:"Repair Board", conversations:"Communication Center", calendar:"Calendar", growth:"Growth" },
    operation:"OPERATIONS", operations:"OPERATIONS", customersGroup:"CUSTOMERS", business:"BUSINESS", mainShop:"Main Shop", location:"Lansdowne · Pennsylvania", health:"Shop Health", month:"+4 pts this month", settings:"Settings", plan:"Collision Growth", search:"Search customer, vehicle, claim or estimate...", intelligence:"Legacy Intelligence", owner:"Owner"
  },
  es: {
    nav: { dashboard:"Dashboard", leads:"Leads", collision:"Centro de Colisiones", customers:"Clientes", vehicles:"Vehículos", estimates:"Presupuestos", repair:"Tablero de Reparación", conversations:"Centro de Comunicación", calendar:"Agenda", growth:"Crecimiento" },
    operation:"OPERACIÓN", operations:"OPERACIÓN", customersGroup:"CLIENTES Y SEGUIMIENTO", business:"NEGOCIO", mainShop:"Taller principal", location:"Lansdowne · Pennsylvania", health:"Salud del taller", month:"+4 pts este mes", settings:"Configuración", plan:"Collision Growth", search:"Buscar cliente, vehículo, claim o presupuesto...", intelligence:"Legacy Intelligence", owner:"Propietario"
  }
} as const;

export default function AppShell({ children, email }: { children: React.ReactNode; email?: string }) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const c = copy[language];
  const [intelligenceOpen,setIntelligenceOpen]=useState(false);
  const [search,setSearch]=useState("");
  return (
    <div className="app-shell collision-theme">
      <aside className="sidebar">
        <div className="brand-row legacy-brand-row">
          <div className="legacy-brand-logo"><img src="/nachos-legacy-logo.webp" alt="Nacho's Legacy" /></div>
          <div className="brand-copy"><strong>Nacho&apos;s Legacy</strong><span>Collision OS · by Austral</span></div>
        </div>

        <div className="workspace-card legacy-workspace">
          <div className="workspace-logo">PA</div>
          <div><strong>{c.mainShop}</strong><span>{c.location}</span></div>
          <ChevronDown size={16}/>
        </div>

        <nav className="main-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-label">{c[group.label]}</p>
              {group.items.map(([key, href, Icon]) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return <Link key={href} href={href} className={active ? "active" : ""}>
                  <span className="nav-icon"><Icon size={18}/></span><span>{c.nav[key]}</span>

                </Link>;
              })}
            </div>
          ))}
        </nav>

        <div className="side-bottom">
          <Link className="settings-button" href="/settings"><Settings size={18}/><span>{c.settings}</span></Link>
          <div className="plan-row"><span>PRO</span><small>{c.plan}</small></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <form className="global-search" action="/collision-center"><Search size={17}/><input name="q" placeholder={c.search} value={search} onChange={e=>setSearch(e.target.value)}/><button type="submit" className="text-button">{language==="es"?"Buscar":"Search"}</button></form>
          <div className="topbar-actions">
            <LanguageSwitch />
            <Link className="icon-button" href="/conversations" aria-label="Inbox"><Bell size={18}/></Link>
            <button className="ai-quick" onClick={()=>setIntelligenceOpen(true)}><Sparkles size={16}/> {c.intelligence}</button>
            <div className="user-menu"><div className="avatar legacy-avatar"><img src="/nachos-legacy-logo.webp" alt="NL" /></div><div><strong>Nacho</strong><span>{email || c.owner}</span></div><button className="text-button" onClick={async()=>{const {createClient}=await import("@/lib/supabase/client");await createClient().auth.signOut();window.location.href="/login";}}>{language==="es"?"Salir":"Sign out"}</button></div>
          </div>
        </header>
        {children}
      </main>
      <LegacyIntelligencePanel open={intelligenceOpen} onClose={()=>setIntelligenceOpen(false)}/>
    </div>
  );
}
