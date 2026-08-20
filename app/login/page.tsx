"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function LoginPage(){
  const[email,setEmail]=useState(""); const[password,setPassword]=useState(""); const[message,setMessage]=useState(""); const{language}=useLanguage(); const es=language==="es";
  const supabaseReady=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!supabaseReady){window.location.href="/dashboard";return;}
    setMessage(es?"Ingresando...":"Signing in...");
    const supabase=createClient(); const{error}=await supabase.auth.signInWithPassword({email,password});
    if(error)return setMessage(error.message); window.location.href="/dashboard";
  }
  return <main className="login-page"><div className="login-language"><LanguageSwitch/></div><section className="login-card"><div className="login-legacy-logo"><img src="/nachos-legacy-logo.webp" alt="Nacho's Legacy"/></div><p className="kicker">NACHO&apos;S LEGACY · AUSTRAL PLATFORM</p><h1>{es?"Bienvenido a Collision OS":"Welcome to Collision OS"}</h1><p className="muted">{supabaseReady?(es?"Ingresá al centro operativo de Nacho's Legacy.":"Sign in to the operating center for Nacho's Legacy."):(es?"Demo lista para presentar. Tocá Ingresar para abrir la plataforma.":"Presentation demo ready. Press Sign in to open the platform.")}</p><form onSubmit={submit}><label>Email<input type="email" required={supabaseReady} value={email} onChange={e=>setEmail(e.target.value)} placeholder="owner@nachoslegacy.com"/></label><label>{es?"Contraseña":"Password"}<input type="password" required={supabaseReady} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label><button className="primary" type="submit">{es?"Ingresar":"Sign in"}</button></form><small>{message}</small></section></main>
}
