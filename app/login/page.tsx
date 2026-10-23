"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function LoginPage(){
  const[email,setEmail]=useState(""); const[password,setPassword]=useState(""); const[message,setMessage]=useState(""); const{language}=useLanguage(); const es=language==="es";
  const supabaseReady=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!supabaseReady){setMessage(es?"Falta configurar la base de datos del CRM.":"CRM database configuration is missing.");return;}
    setMessage(es?"Ingresando...":"Signing in...");
    const supabase=createClient(); const{error}=await supabase.auth.signInWithPassword({email,password});
    if(error)return setMessage(error.message); window.location.href="/dashboard";
  }
  return <main className="login-page"><div className="login-language"><LanguageSwitch/></div><section className="login-card"><div className="login-legacy-logo"><img src="/nachos-legacy-logo.webp" alt="Nacho's Legacy"/></div><p className="kicker">NACHO&apos;S LEGACY · AUSTRAL PLATFORM</p><h1>{es?"Bienvenido a Collision OS":"Welcome to Collision OS"}</h1><p className="muted">{supabaseReady?(es?"Ingresá al centro operativo de Nacho's Legacy.":"Sign in to the operating center for Nacho's Legacy."):(es?"El CRM necesita la conexión a Supabase para ingresar.":"Connect Supabase to enable sign-in.")}</p><form onSubmit={submit}><label>Email<input type="email" required={supabaseReady} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" placeholder="contact@nachoslegacybodyshop.com"/></label><label>{es?"Contraseña":"Password"}<input autoComplete="current-password" type="password" required={supabaseReady} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label><button className="primary" type="submit">{es?"Ingresar":"Sign in"}</button></form><small role="status" aria-live="polite">{message}</small></section></main>
}
