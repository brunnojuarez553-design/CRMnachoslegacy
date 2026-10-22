"use client";
import { useCallback,useEffect,useState } from "react";
export type CrmRecord={id:string;[key:string]:any};
export type Workspace={company:CrmRecord;integrations:{sms:boolean;ai:boolean;intake:boolean};[key:string]:any};
export function useWorkspace(){const[data,setData]=useState<Workspace|null>(null);const[error,setError]=useState("");const[loading,setLoading]=useState(true);
 const reload=useCallback(async()=>{try{const r=await fetch("/api/workspace",{cache:"no-store"});const json=await r.json();if(!r.ok)throw new Error(json.error||"Unable to load records");setData(json);setError("");}catch(e){setError(e instanceof Error?e.message:"Unable to connect");}finally{setLoading(false);}},[]);
 useEffect(()=>{void reload();const timer=setInterval(()=>{if(!document.hidden)void reload();},30000);const focus=()=>void reload();window.addEventListener("focus",focus);return()=>{clearInterval(timer);window.removeEventListener("focus",focus);};},[reload]);return{data,error,loading,reload};}
export function carLabel(v?:CrmRecord){return [v?.year,v?.make,v?.model].filter(Boolean).join(" ")||"—";}
export function customer(data:Workspace,id?:string){return (data.contacts as CrmRecord[]).find(c=>c.id===id);}
export function vehicle(data:Workspace,id?:string){return (data.vehicles as CrmRecord[]).find(c=>c.id===id);}
