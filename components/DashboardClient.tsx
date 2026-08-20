"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bot, CalendarDays, CarFront, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, FileText, ShieldCheck, Sparkles, Star, Wrench, Zap } from "lucide-react";
import AppShell from "./AppShell";
import { useLanguage } from "./LanguageProvider";

const cases = [
  { name: "Maria Rodriguez", car: "2022 Honda Accord", issue: {en:"Rear collision",es:"Colisión trasera"}, insurer: "GEICO", status:{en:"Insurance review",es:"Revisión del seguro"}, value: "$6,850", photos: 8 },
  { name: "John Miller", car: "2021 Ford F-150", issue: {en:"Front-end impact",es:"Impacto frontal"}, insurer: "State Farm", status:{en:"Estimate ready",es:"Presupuesto listo"}, value: "$9,420", photos: 6 },
  { name: "Carlos Rivera", car: "2020 Toyota Camry", issue: {en:"Body & paint",es:"Carrocería y pintura"}, insurer: "Self pay", status:{en:"New intake",es:"Nueva consulta"}, value: "$3,100", photos: 10 },
];

const copy = {
  en: {
    morning:"Good morning", afternoon:"Good afternoon", evening:"Good evening", live:"SHOP OPERATIONS LIVE", intro:"Austral organized today's collision workload and found", actionsCount:"5 priority actions", schedule:"Today's schedule", newCase:"+ New collision case",
    ai:"AUSTRAL INTELLIGENCE", hero1:"Your shop is moving.",hero2:"Here's what needs attention.",heroText:"There are 7 vehicles in shop, 3 claims waiting on insurance and $11,600 in open estimates that need follow-up.", vehicles:"vehicles in shop",claims:"claims pending",opportunity:"open opportunity",ready:"ready for delivery",review:"Review priorities",board:"Open repair board",health:"Shop Health",strong:"Strong operation",healthText:"Cycle time and customer communication are above target.",communication:"Communication",cycle:"Cycle time",reputation:"Reputation",
    metrics:[["Vehicles in shop","7","2 due today","active repairs"],["Open estimates","$31,800","+$6.2K","this week"],["Avg. cycle time","8.4 days","-1.2 days","vs. last month"],["Google reputation","4.9","+8 reviews","this month"]],
    priorities:"PRIORITIES",needs:"What needs attention",p1:"Follow up 3 insurance claims",p1d:"Oldest claim has been waiting 48h",p2:"Recover 4 open estimates",p2d:"No customer response in 24–72h",p3:"2 vehicles ready for pickup",p3d:"Send pickup + review sequence",p4:"Parts delay detected",p4d:"2021 Ford F-150 · bumper reinforcement",today:"Today",case:"1 case",
    flow:"REPAIR FLOW",shop:"Today's shop",vehicleCount:"7 vehicles", flowLabels:[["Disassembly","In progress"],["Body","In progress"],["Paint","In progress"],["Reassembly","In progress"],["QC / Ready","Delivery ready"]],
    intake:"NEW INTAKE",recent:"Recent collision cases",viewAll:"View all",liveFeed:"AUSTRAL LIVE",activity:"Intelligent activity",liveNow:"Live",feeds:[["2 min ago","New intake summarized","Honda Accord · 8 photos · GEICO claim"],["18 min ago","Insurance follow-up due","State Farm claim #SF-94812"],["41 min ago","Estimate viewed","Maria opened estimate #NL-184"],["1 h ago","5-star review received","Google rating remains 4.9"]]
  },
  es: {
    morning:"Buenos días", afternoon:"Buenas tardes", evening:"Buenas noches", live:"OPERACIÓN DEL TALLER EN VIVO", intro:"Austral organizó la carga de colisiones de hoy y detectó", actionsCount:"5 acciones prioritarias", schedule:"Agenda de hoy", newCase:"+ Nuevo caso de colisión",
    ai:"AUSTRAL INTELLIGENCE", hero1:"Tu taller está avanzando.",hero2:"Esto es lo que requiere atención.",heroText:"Hay 7 vehículos en el taller, 3 claims esperando al seguro y $11.600 en presupuestos abiertos que necesitan seguimiento.", vehicles:"vehículos en taller",claims:"claims pendientes",opportunity:"oportunidad abierta",ready:"listos para entregar",review:"Revisar prioridades",board:"Abrir tablero de reparación",health:"Salud del taller",strong:"Operación sólida",healthText:"El tiempo de ciclo y la comunicación con clientes están por encima del objetivo.",communication:"Comunicación",cycle:"Tiempo de ciclo",reputation:"Reputación",
    metrics:[["Vehículos en taller","7","2 se entregan hoy","reparaciones activas"],["Presupuestos abiertos","$31.800","+$6,2K","esta semana"],["Tiempo de ciclo prom.","8,4 días","-1,2 días","vs. mes anterior"],["Reputación Google","4.9","+8 reseñas","este mes"]],
    priorities:"PRIORIDADES",needs:"Qué requiere atención",p1:"Dar seguimiento a 3 claims",p1d:"El claim más antiguo espera hace 48 h",p2:"Recuperar 4 presupuestos abiertos",p2d:"Sin respuesta del cliente hace 24–72 h",p3:"2 vehículos listos para retirar",p3d:"Enviar aviso de retiro + solicitud de reseña",p4:"Demora de repuesto detectada",p4d:"2021 Ford F-150 · refuerzo de paragolpes",today:"Hoy",case:"1 caso",
    flow:"FLUJO DE REPARACIÓN",shop:"Taller de hoy",vehicleCount:"7 vehículos", flowLabels:[["Desarme","En proceso"],["Carrocería","En proceso"],["Pintura","En proceso"],["Rearmado","En proceso"],["QC / Listo","Listo para entregar"]],
    intake:"NUEVAS CONSULTAS",recent:"Casos de colisión recientes",viewAll:"Ver todos",liveFeed:"AUSTRAL EN VIVO",activity:"Actividad inteligente",liveNow:"En vivo",feeds:[["Hace 2 min","Nueva consulta resumida","Honda Accord · 8 fotos · claim GEICO"],["Hace 18 min","Seguimiento de seguro pendiente","Claim State Farm #SF-94812"],["Hace 41 min","Presupuesto visto","Maria abrió el presupuesto #NL-184"],["Hace 1 h","Nueva reseña de 5 estrellas","La calificación de Google se mantiene en 4.9"]]
  }
} as const;

export default function DashboardClient({ email }: { email?: string }) {
  const { language } = useLanguage(); const c = copy[language];
  const greeting = useMemo(() => { const h = new Date().getHours(); return h < 12 ? c.morning : h < 18 ? c.afternoon : c.evening; }, [c]);
  const icons = [<CarFront key="a"/>,<FileText key="b"/>,<Clock3 key="c"/>,<Star key="d"/>];
  const feedIcons = [<Bot key="a"/>,<ShieldCheck key="b"/>,<CircleDollarSign key="c"/>,<Star key="d"/>];
  return <AppShell email={email}>
    <section className="dashboard-page collision-dashboard">
      <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
      <div className="page-heading collision-heading">
        <div><div className="eyebrow live"><span/> {c.live}</div><h1>{greeting}, Nacho.</h1><p>{c.intro} <strong>{c.actionsCount}</strong>.</p></div>
        <div className="heading-actions"><Link href="/calendar" className="secondary-button"><CalendarDays size={17}/> {c.schedule}</Link><Link href="/collision-center/new" className="primary-button">{c.newCase}</Link></div>
      </div>

      <section className="executive-card collision-executive">
        <div className="executive-copy">
          <div className="eyebrow"><Sparkles size={13}/> {c.ai}</div>
          <h2>{c.hero1}<br/><span>{c.hero2}</span></h2>
          <p className="executive-intro">{c.heroText}</p>
          <div className="overnight-grid collision-quick-grid">
            <div><CarFront size={19}/><strong>7</strong><span>{c.vehicles}</span></div><div><ShieldCheck size={19}/><strong>3</strong><span>{c.claims}</span></div><div><CircleDollarSign size={19}/><strong>$11.6K</strong><span>{c.opportunity}</span></div><div><CheckCircle2 size={19}/><strong>2</strong><span>{c.ready}</span></div>
          </div>
          <div className="executive-actions"><Link className="primary-button" href="/collision-center"><Zap size={16}/> {c.review}</Link><Link className="text-button" href="/repair-board">{c.board} <ChevronRight size={16}/></Link></div>
        </div>
        <div className="health-card collision-health"><div className="health-top"><span>{c.health}</span><span className="positive-pill">+4 pts</span></div><div className="health-ring"><div><strong>91</strong><span>/100</span></div></div><h3>{c.strong}</h3><p>{c.healthText}</p><div className="health-breakdown"><span><i style={{width:"94%"}}/>{c.communication} <b>94</b></span><span><i style={{width:"88%"}}/>{c.cycle} <b>88</b></span><span><i style={{width:"92%"}}/>{c.reputation} <b>92</b></span></div></div>
      </section>

      <div className="metrics-grid collision-metrics">{c.metrics.map((m,i)=><Metric key={m[0]} icon={icons[i]} label={m[0]} value={m[1]} change={m[2]} meta={m[3]}/>)}</div>

      <article className="example-showcase dashboard-example"><div className="example-copy"><div className="example-label"><Sparkles size={14}/>{language==="es"?"EJEMPLO DEL DÍA":"TODAY\'S EXAMPLE"}</div><h3>{language==="es"?"Así se vería una mañana real en el taller":"What a real shop morning looks like"}</h3><p>{language==="es"?"Austral concentra la información para que Nacho sepa qué hacer primero sin revisar mensajes, notas y planillas por separado.":"Austral consolidates the information so Nacho knows what to do first without checking messages, notes and spreadsheets separately."}</p><div className="example-result"><CheckCircle2 size={16}/><span>{language==="es"?"Ejemplo: 3 claims pendientes + 4 presupuestos sin respuesta + 2 vehículos listos para entregar = prioridades claras para empezar el día.":"Example: 3 pending claims + 4 unanswered estimates + 2 vehicles ready for pickup = clear priorities to start the day."}</span></div></div><div className="example-steps"><div className="example-step"><span>1</span><div><ShieldCheck size={15}/><p>{language==="es"?"Dar seguimiento a GEICO / State Farm":"Follow up with GEICO / State Farm"}</p></div></div><div className="example-step"><span>2</span><div><CircleDollarSign size={15}/><p>{language==="es"?"Recuperar $11.600 en estimates":"Recover $11,600 in estimates"}</p></div></div><div className="example-step"><span>3</span><div><CheckCircle2 size={15}/><p>{language==="es"?"Avisar a clientes listos para retirar":"Notify customers ready for pickup"}</p></div></div><div className="example-step"><span>4</span><div><Wrench size={15}/><p>{language==="es"?"Revisar demora de repuestos":"Review parts delay"}</p></div></div></div></article>

      <div className="dashboard-grid collision-grid">
        <article className="panel action-center collision-priorities"><PanelHeader eyebrow={c.priorities} title={c.needs} action="$18,450"/><div className="priority-cards"><Priority tone="danger" icon={<ShieldCheck/>} title={c.p1} detail={c.p1d} value="$9,700" href="/collision-center"/><Priority tone="warning" icon={<CircleDollarSign/>} title={c.p2} detail={c.p2d} value="$11,600" href="/estimates"/><Priority tone="success" icon={<CheckCircle2/>} title={c.p3} detail={c.p3d} value={c.today} href="/repair-board"/><Priority tone="info" icon={<Wrench/>} title={c.p4} detail={c.p4d} value={c.case} href="/repair-board"/></div></article>
        <article className="panel shop-flow-panel"><PanelHeader eyebrow={c.flow} title={c.shop} action={c.vehicleCount}/><div className="shop-flow">{c.flowLabels.map(([label,meta],i)=><div key={label} className={`flow-step f${i}`}><span>{[2,2,1,1,1][i]}</span><strong>{label}</strong><small>{meta}</small></div>)}</div></article>
        <article className="panel cases-panel"><PanelHeader eyebrow={c.intake} title={c.recent} action={c.viewAll}/><div className="case-list">{cases.map(x=><Link href="/collision-center" className="case-row" key={x.name}><div className="case-photo-placeholder"><CarFront size={20}/><b>{x.photos}</b></div><div className="case-primary"><strong>{x.name}</strong><span>{x.car} · {x.issue[language]}</span><small>{x.insurer}</small></div><span className="case-status">{x.status[language]}</span><b className="case-value">{x.value}</b><ChevronRight size={16}/></Link>)}</div></article>
        <article className="panel intelligence-feed"><PanelHeader eyebrow={c.liveFeed} title={c.activity} action={c.liveNow}/><div className="feed-list">{c.feeds.map((f,i)=><Feed key={f[1]} icon={feedIcons[i]} time={f[0]} title={f[1]} body={f[2]}/>)}</div></article>
      </div>
    </section>
  </AppShell>;
}

function Metric({icon,label,value,change,meta}:{icon:React.ReactNode,label:string,value:string,change:string,meta:string}) { return <article className="metric-card"><div className="metric-top"><span>{label}</span><i>{icon}</i></div><div className="metric-main"><div><strong>{value}</strong><p><b>↗ {change}</b> {meta}</p></div></div></article> }
function PanelHeader({eyebrow,title,action}:{eyebrow:string,title:string,action:string}) { return <div className="panel-header"><div><span>{eyebrow}</span><h3>{title}</h3></div><button>{action}</button></div> }
function Priority({tone,icon,title,detail,value,href}:{tone:string,icon:React.ReactNode,title:string,detail:string,value:string,href:string}) { return <Link href={href} className="priority-card"><span className={`action-dot ${tone}`}>{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><b>{value}</b><ChevronRight size={16}/></Link> }
function Feed({time,icon,title,body}:{time:string,icon:React.ReactNode,title:string,body:string}) { return <div className="feed-row"><span className="feed-icon">{icon}</span><div><p>{time}</p><strong>{title}</strong><span>{body}</span></div><ChevronRight size={15}/></div> }
