"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, CalendarDays, CarFront, ChevronDown, ClipboardList, FileText, LayoutDashboard,
  MessageCircle, Search, Settings, Sparkles, TrendingUp, Users, Wrench, UserPlus, Menu, X, LogOut
} from "lucide-react";
import LanguageSwitch from "./LanguageSwitch";
import LegacyIntelligencePanel from "./LegacyIntelligencePanel";
import { useState, useEffect, useRef } from "react";
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
  const [navigationOpen,setNavigationOpen]=useState(false);
  const navigationRef=useRef<HTMLElement>(null);
  const menuRef=useRef<HTMLButtonElement>(null);
  useEffect(()=>{setNavigationOpen(false)},[pathname]);
  useEffect(()=>{
    if(!navigationOpen)return;
    const previousOverflow=document.body.style.overflow;document.body.style.overflow="hidden";
    const drawer=navigationRef.current;
    const focusable=()=>Array.from(drawer?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')||[]).filter(el=>el.getClientRects().length);
    focusable()[0]?.focus();
    function onKey(e:KeyboardEvent){
      if(e.key==="Escape"){setNavigationOpen(false);return;}
      if(e.key!=="Tab")return;
      const nodes=focusable(),first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
    const media=window.matchMedia("(min-width: 901px)");
    const onResize=()=>{if(media.matches)setNavigationOpen(false)};
    document.addEventListener("keydown",onKey);media.addEventListener("change",onResize);
    return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener("keydown",onKey);media.removeEventListener("change",onResize);menuRef.current?.focus();};
  },[navigationOpen]);
  async function signOut(){const {createClient}=await import("@/lib/supabase/client");await createClient().auth.signOut();window.location.href="/login";}

  return (
    <div className={`app-shell collision-theme ${navigationOpen?"navigation-open":""}`}>
      <button className="navigation-backdrop" aria-label={language==="es"?"Cerrar navegación":"Close navigation"} tabIndex={-1} onClick={()=>setNavigationOpen(false)}/>
      <aside className="sidebar" id="crm-navigation" ref={navigationRef} aria-label={language==="es"?"Navegación principal":"Main navigation"}>
        <div className="brand-row legacy-brand-row"><button type="button" className="mobile-nav-close icon-button" onClick={()=>setNavigationOpen(false)} aria-label={language==="es"?"Cerrar menú":"Close menu"}><X size={18}/></button>
          <div className="legacy-brand-logo"><img src="/nachos-legacy-logo.webp" alt="Nacho's Legacy" /></div>
          <div className="brand-copy"><strong>Nacho&apos;s Legacy</strong><span>Collision OS · by Austral</span></div>
        </div>

        <div className="workspace-card legacy-workspace">
          <div className="workspace-logo">PA</div>
          <div><strong>{c.mainShop}</strong><span>{c.location}</span></div>
          <ChevronDown size={16}/>
        </div>

        <nav className="main-nav" aria-label={language==="es"?"Secciones del taller":"Shop sections"}>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-label">{c[group.label]}</p>
              {group.items.map(([key, href, Icon]) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return <Link key={href} href={href} className={active ? "active" : ""} aria-current={active?"page":undefined} onClick={()=>setNavigationOpen(false)}>
                  <span className="nav-icon"><Icon size={18}/></span><span>{c.nav[key]}</span>

                </Link>;
              })}
            </div>
          ))}
        </nav>

        <div className="side-bottom">
          <Link className={`settings-button ${pathname==="/settings"?"active":""}`} href="/settings" aria-current={pathname==="/settings"?"page":undefined}><Settings size={18}/><span>{c.settings}</span></Link>
          <div className="plan-row"><span>PRO</span><small>{c.plan}</small></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button ref={menuRef} type="button" className="mobile-nav-toggle icon-button" aria-controls="crm-navigation" aria-expanded={navigationOpen} aria-label={language==="es"?"Abrir menú":"Open menu"} onClick={()=>setNavigationOpen(!navigationOpen)}><Menu size={20}/></button>
          <form className="global-search" action="/collision-center"><Search size={17}/><input name="q" aria-label={c.search} placeholder={c.search} value={search} onChange={e=>setSearch(e.target.value)}/><button type="submit" className="text-button">{language==="es"?"Buscar":"Search"}</button></form>
          <div className="topbar-actions">
            <LanguageSwitch />
            <Link className="icon-button" href="/conversations" aria-label={language==="es"?"Bandeja de consultas":"Inbox"}><Bell size={18}/></Link>
            <button className="ai-quick" onClick={()=>setIntelligenceOpen(true)}><Sparkles size={16}/> {c.intelligence}</button>
            <div className="user-menu"><div className="avatar legacy-avatar"><img src="/nachos-legacy-logo.webp" alt="NL" /></div><div><strong>Nacho</strong><span>{email || c.owner}</span></div><button className="text-button sign-out" onClick={signOut} aria-label={language==="es"?"Cerrar sesión":"Sign out"}><LogOut size={16}/><span>{language==="es"?"Salir":"Sign out"}</span></button></div>
          </div>
        </header>
        {children}
      </main>
      <LegacyIntelligencePanel open={intelligenceOpen} onClose={()=>setIntelligenceOpen(false)}/>
    </div>
  );
}
