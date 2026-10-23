"use client";
import AppShell from "./AppShell";
import { ChevronRight, Search } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import ExportButton, { ExportColumn } from "./ExportButton";

export default function ModulePage({title,eyebrow,description,stats,children,email,addLabel,headerAction}:{title:string;eyebrow:string;description:string;stats:{label:string,value:string,meta:string}[];children:React.ReactNode;email?:string;addLabel?:string;headerAction?:React.ReactNode}){
  const { language } = useLanguage();
  return <AppShell email={email}><section className="module-page"><div className="module-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="module-actions">{headerAction}</div></div>{stats.length>0&&<div className="module-stats">{stats.map(s=><div className="module-stat" key={s.label}><span>{s.label}</span><strong>{s.value}</strong><small>{s.meta}</small></div>)}</div>}{children}</section></AppShell>
}

export function DataToolbar<T>({placeholder="Search...",rows,columns,filename}:{placeholder?:string;rows?:readonly T[];columns?:readonly ExportColumn<T>[];filename?:string}){const {language}=useLanguage(); return <div className="data-toolbar"><div className="table-search"><Search size={16}/><input placeholder={placeholder}/></div><div className="toolbar-actions"><button className="secondary-button">{language === "es" ? "Filtros" : "Filters"}</button><button className="secondary-button">{language === "es" ? "Ordenar" : "Sort"}</button>{rows&&columns&&filename?<ExportButton rows={rows} columns={columns} filename={filename}/>:null}</div></div>}
export function StatusPill({children,tone="neutral"}:{children:React.ReactNode;tone?:string}){return <span className={`status-pill ${tone}`}>{children}</span>}
export function RowArrow(){return <ChevronRight size={16}/>}
