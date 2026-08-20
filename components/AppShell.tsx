"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, CalendarDays, CarFront, ChevronDown, ClipboardList, FileText, LayoutDashboard,
  MessageCircle, Search, Settings, Sparkles, TrendingUp, Users, Wrench, UserPlus
} from "lucide-react";
import LanguageSwitch from "./LanguageSwitch";
import { useLanguage } from "./LanguageProvider";

const nav = [
  ["dashboard", "/dashboard", LayoutDashboard],
  ["leads", "/leads", UserPlus],
  ["collision", "/collision-center", Wrench],
  ["customers", "/customers", Users],
  ["vehicles", "/vehicles", CarFront],
  ["estimates", "/estimates", FileText],
  ["repair", "/repair-board", ClipboardList],
  ["conversations", "/conversations", MessageCircle],
  ["calendar", "/calendar", CalendarDays],
  ["growth", "/growth", TrendingUp],
] as const;

const copy = {
  en: {
    nav: { dashboard:"Dashboard", leads:"Leads", collision:"Collision Center", customers:"Customers", vehicles:"Vehicles", estimates:"Estimates", repair:"Repair Board", conversations:"Communication Center", calendar:"Calendar", growth:"Growth" },
    operation:"OPERATIONS", mainShop:"Main Shop", location:"Lansdowne · Pennsylvania", health:"Shop Health", month:"+4 pts this month", settings:"Settings", plan:"Collision Growth", search:"Search customer, vehicle, claim or estimate...", intelligence:"Legacy Intelligence", owner:"Owner"
  },
  es: {
    nav: { dashboard:"Dashboard", leads:"Leads", collision:"Centro de Colisiones", customers:"Clientes", vehicles:"Vehículos", estimates:"Presupuestos", repair:"Tablero de Reparación", conversations:"Centro de Comunicación", calendar:"Agenda", growth:"Crecimiento" },
    operation:"OPERACIÓN", mainShop:"Taller principal", location:"Lansdowne · Pennsylvania", health:"Salud del taller", month:"+4 pts este mes", settings:"Configuración", plan:"Collision Growth", search:"Buscar cliente, vehículo, claim o presupuesto...", intelligence:"Legacy Intelligence", owner:"Propietario"
  }
} as const;

export default function AppShell({ children, email }: { children: React.ReactNode; email?: string }) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const c = copy[language];
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
          <p className="nav-label">{c.operation}</p>
          {nav.map(([key, href, Icon]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} className={active ? "active" : ""}>
              <span className="nav-icon"><Icon size={18}/></span><span>{c.nav[key]}</span>
              {key === "conversations" && <em>4</em>}
            </Link>;
          })}
        </nav>

        <div className="side-bottom">
          <div className="mini-score">
            <div className="mini-score-head"><span>{c.health}</span><strong>91</strong></div>
            <div className="score-track"><i style={{width:"91%"}}/></div>
            <small>{c.month}</small>
          </div>
          <Link className="settings-button" href="/settings"><Settings size={18}/><span>{c.settings}</span></Link>
          <div className="plan-row"><span>PRO</span><small>{c.plan}</small></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="global-search"><Search size={17}/><input placeholder={c.search}/><kbd>⌘ K</kbd></div>
          <div className="topbar-actions">
            <LanguageSwitch />
            <button className="icon-button notification" aria-label="Notifications"><Bell size={18}/><i/></button>
            <button className="ai-quick"><Sparkles size={16}/> {c.intelligence}</button>
            <div className="user-menu"><div className="avatar legacy-avatar"><img src="/nachos-legacy-logo.webp" alt="NL" /></div><div><strong>Nacho</strong><span>{email || c.owner}</span></div><ChevronDown size={15}/></div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
