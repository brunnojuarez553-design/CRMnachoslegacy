"use client";
import { useState } from "react";
import { Bot, Send, Sparkles, X, WandSparkles } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type Msg={role:"user"|"assistant";content:string};
const examples={
  en:[
    {label:"New collision lead",prompt:"Prepare a checklist of the information to collect for a new collision inquiry. Do not invent customer or vehicle details."},
    {label:"Write progress SMS",prompt:"Draft a repair-progress SMS template using [name], [vehicle] and [stage] as placeholders."},
    {label:"Insurance follow-up",prompt:"Draft a professional follow-up asking a customer for their insurance claim number and damage photos."},
  ],
  es:[
    {label:"Nuevo lead de colisión",prompt:"Prepará una lista de los datos que necesitamos para una nueva consulta de colisión. No inventes datos de clientes ni vehículos."},
    {label:"Crear SMS de avance",prompt:"Redactá una plantilla de SMS de avance con [nombre], [vehículo] y [etapa] para completar."},
    {label:"Seguimiento de seguro",prompt:"Redactá un seguimiento profesional pidiendo al cliente el número de claim del seguro y fotos del daño."},
  ]
};
export default function LegacyIntelligencePanel({open,onClose}:{open:boolean;onClose:()=>void}){
 const {language}=useLanguage(); const es=language==="es";
 const [messages,setMessages]=useState<Msg[]>([{role:"assistant",content:es?"Soy Legacy Intelligence. Puedo ayudar a responder consultas, preparar seguimientos y redactar SMS de avance para los clientes del taller.":"I'm Legacy Intelligence. I can help answer inquiries, prepare follow-ups, and draft repair-progress SMS messages for shop customers."}]);
 const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
 if(!open)return null;
 async function ask(text?:string){const q=(text??input).trim();if(!q||loading)return;setMessages(m=>[...m,{role:"user",content:q}]);setInput("");setLoading(true);try{const r=await fetch("/api/ai/respond",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q,language,context:"Drafting assistant only. No access to actual shop records. Do not invent customer or repair data."})});const j=await r.json();setMessages(m=>[...m,{role:"assistant",content:j.reply||j.error||(es?"No pude generar la respuesta.":"I couldn't generate a response.")}])}catch{setMessages(m=>[...m,{role:"assistant",content:es?"No se pudo conectar con el asistente. Intentá nuevamente.":"Could not connect to the assistant. Please try again."}])}finally{setLoading(false)}}
 return <div className="li-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="li-panel">
  <header className="li-head"><div className="li-icon"><Sparkles size={20}/></div><div><span>LEGACY INTELLIGENCE</span><h2>{es?"Asistente inteligente del taller":"Shop intelligence assistant"}</h2><p>{es?"Ayuda para redactar mensajes del taller":"Help draft customer messages"}</p></div><button onClick={onClose}><X size={20}/></button></header>
  <div className="li-demo"><div><WandSparkles size={16}/><strong>{es?"Plantillas de mensajes":"Message templates"}</strong></div><div className="li-chips">{examples[language].map(x=><button key={x.label} onClick={()=>ask(x.prompt)}>{x.label}</button>)}</div></div>
  <div className="li-chat">{messages.map((m,i)=><div key={i} className={`li-message ${m.role}`}><span>{m.role==="assistant"?<Bot size={15}/>:"NL"}</span><p>{m.content}</p></div>)}{loading&&<div className="li-message assistant"><span><Bot size={15}/></span><p>{es?"Preparando respuesta…":"Preparing response…"}</p></div>}</div>
  <footer className="li-compose"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void ask()}}} placeholder={es?"Preguntale algo sobre un cliente, reparación o seguimiento…":"Ask about a customer, repair, or follow-up…"}/><button onClick={()=>ask()} disabled={!input.trim()||loading}><Send size={17}/></button></footer>
  <div className="li-note">{es?"El asistente redacta sugerencias. Revisá los datos antes de enviarlas; no envía mensajes automáticamente.":"The assistant drafts suggestions. Check the details before sending; it does not send messages automatically."}</div>
 </section></div>
}
