"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, CarFront, Check, ChevronRight, Download, ExternalLink, Loader2, MessageSquareText, Phone, ShieldCheck, X } from "lucide-react";
import ModulePage, { DataToolbar, StatusPill } from "@/components/ModulePage";
import { ExportColumn, RecordExportButton } from "@/components/ExportButton";
import { useLanguage } from "@/components/LanguageProvider";
import { buildRepairSms, REPAIR_STAGES, RepairStageKey, stageLabel } from "@/lib/repair-stages";

type Contact = { id?: string; full_name?: string | null; phone?: string | null; email?: string | null; preferred_language?: "en" | "es" | null };
type Vehicle = { id?: string; year?: number | null; make?: string | null; model?: string | null; vin?: string | null; plate?: string | null };
type CasePhoto = { id: string; url: string; stage?: string | null; sort_order?: number | null; created_at?: string | null };
type RepairUpdate = { id: string; stage: string; customer_message?: string | null; sms_status?: string | null; sms_sid?: string | null; notified_at?: string | null; created_at?: string | null };
export type CollisionCase = {
  id: string; case_number?: string | null; intake_type?: string | null; status: string; damage_area?: string | null; damage_description?: string | null;
  drivable?: boolean | null; vehicle_location?: string | null; insurance_company?: string | null; has_claim?: boolean | null; claim_number?: string | null;
  source?: string | null; medium?: string | null; campaign?: string | null; landing?: string | null; priority?: string | null; preferred_language?: "en" | "es" | null;
  created_at?: string | null; updated_at?: string | null; contacts?: Contact | Contact[] | null; vehicles?: Vehicle | Vehicle[] | null;
  case_photos?: CasePhoto[] | null; repair_updates?: RepairUpdate[] | null;
};

type Row = { id:string; name:string; car:string; damage:string; insurance:string; photos:number; status:string; tone:string; value:string; source:string; raw?:CollisionCase };
const demoRows:Row[]=[
{id:"NL-0184",name:"Maria Rodriguez",car:"2022 Honda Accord",damage:"Rear collision",insurance:"GEICO",photos:8,status:"Insurance review",tone:"warning",value:"$6,850",source:"Instagram"},
{id:"NL-0185",name:"John Miller",car:"2021 Ford F-150",damage:"Front-end impact",insurance:"State Farm",photos:6,status:"Estimate ready",tone:"info",value:"$9,420",source:"SMS"},
{id:"NL-0186",name:"Carlos Rivera",car:"2020 Toyota Camry",damage:"Body & paint",insurance:"Self pay",photos:10,status:"New intake",tone:"danger",value:"$3,100",source:"Web"},
];

function first<T>(value:T|T[]|null|undefined):T|undefined{return Array.isArray(value)?value[0]:value||undefined}
function vehicleLabel(v?:Vehicle){return [v?.year,v?.make,v?.model].filter(Boolean).join(" ")||"Vehicle not specified"}
function toneForStatus(status:string){if(status==="ready_for_pickup"||status==="delivered")return "success";if(status==="paint"||status==="quality_control")return "warning";if(status==="new_intake")return "danger";return "info"}

export default function CollisionCasesClient(){
  const {language}=useLanguage(); const es=language==="es";
  const [cases,setCases]=useState<CollisionCase[]>([]); const [loading,setLoading]=useState(true); const [loadError,setLoadError]=useState("");
  const [selected,setSelected]=useState<CollisionCase|null>(null);
  const loadCases=useCallback(async()=>{setLoading(true);setLoadError("");try{const res=await fetch("/api/cases",{cache:"no-store"});if(!res.ok)throw new Error(await res.text());const json=await res.json();setCases(json.cases||[])}catch(e){setLoadError(e instanceof Error?e.message:"Unable to load cases")}finally{setLoading(false)}},[]);
  useEffect(()=>{void loadCases()},[loadCases]);
  const rows=useMemo<Row[]>(()=>cases.length?cases.map((c)=>{const contact=first(c.contacts);const vehicle=first(c.vehicles);return{id:c.case_number||c.id.slice(0,8),name:contact?.full_name||"Unknown customer",car:vehicleLabel(vehicle),damage:c.damage_area||c.damage_description||"Damage not specified",insurance:c.insurance_company||"Not provided",photos:c.case_photos?.length||0,status:stageLabel(c.status,language),tone:toneForStatus(c.status),value:"—",source:c.source||c.medium||"Web",raw:c}}):demoRows, [cases,language]);
  const columns:ExportColumn<Row>[]=[{key:"id",label:es?"Caso":"Case"},{key:"name",label:es?"Cliente":"Customer"},{key:"car",label:es?"Vehículo":"Vehicle"},{key:"damage",label:es?"Daño":"Damage"},{key:"insurance",label:es?"Seguro":"Insurance"},{key:"photos",label:es?"Fotos":"Photos"},{key:"status",label:es?"Estado":"Status"},{key:"source",label:es?"Origen":"Source"}];
  const live=cases.length>0;
  return <>
    <ModulePage eyebrow={es?"CRM DE COLISIONES":"COLLISION CRM"} title={es?"Centro de Colisiones":"Collision Center"} description={es?"Abrí cada caso para ver exactamente lo que mandó el cliente, sus fotos y actualizar el avance con SMS.":"Open each case to see exactly what the customer submitted, their photos, and update repair progress with SMS."} stats={es?[{label:"Casos reales",value:String(cases.length),meta:live?"desde formularios":"esperando conexión"},{label:"Con fotos",value:String(cases.filter(c=>(c.case_photos?.length||0)>0).length),meta:"intake recibido"},{label:"SMS de avance",value:"1 clic",meta:"con confirmación"},{label:"Canal principal",value:"SMS",meta:"Pennsylvania"}]:[{label:"Live cases",value:String(cases.length),meta:live?"from intake forms":"waiting for connection"},{label:"With photos",value:String(cases.filter(c=>(c.case_photos?.length||0)>0).length),meta:"intake received"},{label:"Progress SMS",value:"1 click",meta:"with confirmation"},{label:"Primary channel",value:"SMS",meta:"Pennsylvania"}]}>
      {loadError&&<div className="system-note warning"><strong>{es?"Modo demostración activo":"Demo mode active"}</strong><span>{es?"La interfaz funciona, pero Supabase todavía no devolvió casos reales. Cuando conectes el Intake, van a aparecer acá automáticamente.":"The interface works, but Supabase has not returned live cases yet. Once Intake is connected, they will appear here automatically."}</span></div>}
      <article className="data-panel"><DataToolbar rows={rows} columns={columns} filename={`nachos-legacy-collision-cases-${language}`} placeholder={es?"Buscar nombre, vehículo, claim o ID...":"Search name, vehicle, claim or case ID..."}/>
        {loading?<div className="loading-state"><Loader2 className="spin" size={22}/>{es?"Cargando casos...":"Loading cases..."}</div>:<div className="data-table collision-table export-table"><div className="table-head"><span>{es?"Caso":"Case"}</span><span>{es?"Cliente / Vehículo":"Customer / Vehicle"}</span><span>{es?"Daño":"Damage"}</span><span>{es?"Seguro":"Insurance"}</span><span>{es?"Fotos":"Photos"}</span><span>{es?"Estado":"Status"}</span><span>{es?"Abrir":"Open"}</span><span>{es?"Exportar":"Export"}</span></div>{rows.map(r=><div className="table-row clickable-row" key={r.id} onClick={()=>r.raw&&setSelected(r.raw)}><b>{r.id}</b><div className="table-person"><span className="mini-avatar"><CarFront size={15}/></span><div><strong>{r.name}</strong><small>{r.car} · {r.source}</small></div></div><span>{r.damage}</span><span className="inline-icon"><ShieldCheck size={14}/>{r.insurance}</span><span className="inline-icon"><Camera size={14}/>{r.photos}</span><StatusPill tone={r.tone}>{r.status}</StatusPill><button className="open-record" disabled={!r.raw} onClick={(e)=>{e.stopPropagation();if(r.raw)setSelected(r.raw)}}>{es?"Ver ficha":"View case"}<ChevronRight size={14}/></button><span onClick={e=>e.stopPropagation()}><RecordExportButton row={r} columns={columns} filename={`${r.id}-${r.name.replace(/\s+/g,"-")}`}/></span></div>)}</div>}
      </article>
    </ModulePage>
    {selected&&<CaseModal repairCase={selected} onClose={()=>setSelected(null)} onUpdated={async()=>{await loadCases();const res=await fetch("/api/cases",{cache:"no-store"});if(res.ok){const json=await res.json();const fresh=(json.cases||[]).find((c:CollisionCase)=>c.id===selected.id);if(fresh)setSelected(fresh)}}}/>} 
  </>
}

function CaseModal({repairCase,onClose,onUpdated}:{repairCase:CollisionCase;onClose:()=>void;onUpdated:()=>Promise<void>}){
  const {language}=useLanguage(); const es=language==="es"; const contact=first(repairCase.contacts); const vehicle=first(repairCase.vehicles); const preferred=((contact?.preferred_language||repairCase.preferred_language||"en") as "en"|"es");
  const [stage,setStage]=useState<RepairStageKey>((REPAIR_STAGES.some(s=>s.key===repairCase.status)?repairCase.status:"vehicle_received") as RepairStageKey);
  const [currentStage,setCurrentStage]=useState(repairCase.status);
  const [history,setHistory]=useState<RepairUpdate[]>(()=>[...(repairCase.repair_updates||[])].sort((a,b)=>new Date(b.created_at||0).getTime()-new Date(a.created_at||0).getTime()));
  const [message,setMessage]=useState(()=>buildRepairSms({stage,customerName:contact?.full_name,vehicle:vehicleLabel(vehicle),language:preferred}));
  const [sending,setSending]=useState(false); const [error,setError]=useState(""); const [success,setSuccess]=useState("");
  useEffect(()=>{setMessage(buildRepairSms({stage,customerName:contact?.full_name,vehicle:vehicleLabel(vehicle),language:preferred}))},[stage,contact?.full_name,vehicle?.year,vehicle?.make,vehicle?.model,preferred]);
  async function confirm(){setSending(true);setError("");setSuccess("");try{const res=await fetch(`/api/cases/${repairCase.id}/stage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stage,notifyCustomer:true,message})});const json=await res.json();if(!res.ok)throw new Error(json.error||"Unable to update");setCurrentStage(stage);if(json.update)setHistory(prev=>[json.update,...prev.filter(x=>x.id!==json.update.id)]);setSuccess(json.mode==="demo"?(es?"Demo: avance guardado y SMS simulado correctamente.":"Demo: progress saved and SMS simulated successfully."):(es?"Avance guardado y SMS enviado correctamente.":"Progress saved and SMS sent successfully."));if(json.mode!=="demo")await onUpdated()}catch(e){setError(e instanceof Error?e.message:"Unable to send SMS")}finally{setSending(false)}}
  const photos=[...(repairCase.case_photos||[])].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  return <div className="case-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="case-modal"><header className="case-modal-head"><div><span>{repairCase.case_number||"Collision Case"}</span><h2>{contact?.full_name|| (es?"Cliente":"Customer")}</h2><p>{vehicleLabel(vehicle)}</p></div><button className="modal-close" onClick={onClose}><X size={20}/></button></header>
    <div className="case-modal-body"><section className="case-summary-grid"><Info label={es?"Teléfono":"Phone"} value={contact?.phone||"—"}/><Info label="Email" value={contact?.email||"—"}/><Info label={es?"Daño":"Damage"} value={repairCase.damage_area||repairCase.damage_description||"—"}/><Info label={es?"Puede circular":"Drivable"} value={repairCase.drivable==null?"—":repairCase.drivable?(es?"Sí":"Yes"):(es?"No":"No")}/><Info label={es?"Seguro":"Insurance"} value={repairCase.insurance_company||"—"}/><Info label="Claim" value={repairCase.claim_number|| (repairCase.has_claim? (es?"Sí, sin número":"Yes, no number") : "—")}/><Info label={es?"Ubicación vehículo":"Vehicle location"} value={repairCase.vehicle_location||"—"}/><Info label={es?"Origen":"Source"} value={[repairCase.source,repairCase.medium].filter(Boolean).join(" · ")||"—"}/></section>
      {repairCase.damage_description&&<section className="case-description"><span>{es?"Descripción enviada por el cliente":"Customer description"}</span><p>{repairCase.damage_description}</p></section>}
      <section className="case-section"><div className="case-section-head"><div><span>{es?"FOTOS DEL FORMULARIO":"FORM PHOTOS"}</span><h3>{es?"Fotos enviadas por el cliente":"Photos submitted by the customer"}</h3></div><b>{photos.length}</b></div>{photos.length?<div className="case-photo-grid">{photos.map((photo,index)=><a href={photo.url} target="_blank" rel="noreferrer" className="case-real-photo" key={photo.id}><img src={photo.url} alt={`${repairCase.case_number||"Case"} ${index+1}`}/><span>{es?`Foto ${index+1}`:`Photo ${index+1}`} <ExternalLink size={12}/></span></a>)}</div>:<div className="empty-photos"><Camera size={26}/><strong>{es?"Todavía no hay fotos":"No photos yet"}</strong><span>{es?"Cuando el cliente suba imágenes desde el formulario aparecerán acá.":"When the customer uploads images through the form, they will appear here."}</span></div>}</section>
      <section className="progress-sms-card"><div className="case-section-head"><div><span>{es?"AVANCE + SMS":"PROGRESS + SMS"}</span><h3>{es?"Actualizar estado del vehículo":"Update vehicle progress"}</h3></div><MessageSquareText size={20}/></div><p className="progress-help">{es?"Elegí la etapa. Antes de confirmar podés revisar o editar el mensaje. Al confirmar, el avance se guarda y el SMS se envía al teléfono del cliente.":"Choose the stage. Before confirming you can review or edit the message. When confirmed, progress is saved and the SMS is sent to the customer's phone."}</p>
        <div className="stage-selector">{REPAIR_STAGES.map((s,i)=><button key={s.key} className={stage===s.key?"selected":""} onClick={()=>setStage(s.key)}><span>{i+1}</span>{s[language]}{currentStage===s.key&&<Check size={13}/>}</button>)}</div>
        <div className="sms-preview"><div className="sms-preview-head"><span><Phone size={14}/>{contact?.phone|| (es?"Sin teléfono":"No phone")}</span><b>SMS</b></div><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5}/><small>{es?"Se enviará solamente después de presionar Confirmar y enviar SMS.":"It will only be sent after pressing Confirm & send SMS."}</small></div>
        {error&&<div className="form-feedback error">{error}</div>}{success&&<div className="form-feedback success">{success}</div>}
        <button className="confirm-sms-button" disabled={sending||!contact?.phone} onClick={confirm}>{sending?<><Loader2 className="spin" size={17}/>{es?"Enviando...":"Sending..."}</>:<><MessageSquareText size={17}/>{es?"Confirmar avance y enviar SMS":"Confirm progress & send SMS"}</>}</button>
      </section>
      <section className="case-section"><div className="case-section-head"><div><span>{es?"HISTORIAL":"HISTORY"}</span><h3>{es?"Avances notificados":"Notified progress"}</h3></div></div>{history.length?<div className="repair-history">{history.map(update=><div key={update.id}><span className={`history-status ${update.sms_status==="sent"?"sent":""}`}><Check size={13}/></span><div><strong>{stageLabel(update.stage,language)}</strong><p>{update.customer_message||"—"}</p><small>{update.created_at?new Date(update.created_at).toLocaleString(language==="es"?"es-AR":"en-US"):""} · {update.sms_status==="sent"?(es?"SMS enviado ✓":"SMS sent ✓"):(es?"Sin SMS":"No SMS")}</small></div></div>)}</div>:<div className="empty-history">{es?"Todavía no hay avances registrados.":"No progress updates have been recorded yet."}</div>}</section>
    </div>
  </div></div>
}
function Info({label,value}:{label:string;value:string}){return <div className="case-info"><span>{label}</span><strong>{value}</strong></div>}
