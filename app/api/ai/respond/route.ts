import { requireWorkspace } from "@/lib/internal-auth";
import { apiError } from "@/lib/api";
import { NextResponse } from "next/server";
import { z } from "zod";
const schema=z.object({message:z.string().trim().min(1).max(8000),context:z.string().max(8000).optional(),language:z.enum(["en","es"]).default("en")});
export async function POST(request:Request){
  try{await requireWorkspace();
    const {message,context,language}=schema.parse(await request.json()); const key=process.env.GROQ_API_KEY;
    const lower=message.toLowerCase();
    let fallback=language==="es"?"Gracias por escribirnos. Para poder ayudarte, indicame marca, modelo, año, qué ocurrió y un teléfono de contacto.":"Thanks for reaching out. To help you, please send the vehicle make, model, year, what happened, and a contact phone number.";
    if(lower.includes("paint")||lower.includes("pintura")) fallback=language==="es"?"Hola [nombre], te contamos que tu vehículo ya pasó a la etapa de pintura en Nacho’s Legacy. Te vamos a mantener al tanto a medida que avance la reparación.":"Hi [name], your vehicle has now moved into the paint stage at Nacho’s Legacy. We’ll keep you updated as the repair progresses.";
    else if(lower.includes("claim")||lower.includes("seguro")||lower.includes("insurance")) fallback=language==="es"?"Hola, para continuar con la evaluación ¿podés enviarnos el número de claim de tu seguro y algunas fotos claras del daño? Con eso podemos organizar mejor la revisión del vehículo.":"Hi, to continue your evaluation, could you send us your insurance claim number and a few clear photos of the damage? That will help us organize the vehicle review.";
    else if(lower.includes("rear-ended")||lower.includes("chocaron")||lower.includes("colisión")) fallback=language==="es"?"Para preparar una consulta de colisión, pedí nombre y teléfono, número de claim si ya lo tiene, una breve descripción del daño y fotos del vehículo. Después podemos crear el caso y coordinar la evaluación.":"To prepare a collision inquiry, collect the customer's name and phone, claim number if available, a short damage description, and vehicle photos. Then create the case and coordinate the evaluation.";
    if(!key)return NextResponse.json({reply:fallback,mode:"fallback",language});
    const system=language==="es"
      ?`Sos Legacy Intelligence, el asistente de Nacho's Legacy Body Shop en Pennsylvania. Respondé siempre en español, de forma humana, clara y breve. Ayudá con consultas de colisión, carrocería, pintura y seguros. No diagnostiques daños estructurales ni confirmes precios sin revisión humana. Recolectá vehículo, año, descripción del daño, si puede circular, seguro/claim, fotos y datos de contacto cuando corresponda. Contexto: ${context||"sin contexto"}`
      :`You are Legacy Intelligence, the assistant for Nacho's Legacy Body Shop in Pennsylvania. Always reply in English, in a clear, human and concise tone. Help with collision, body, paint and insurance inquiries. Never diagnose structural damage or confirm pricing without human review. Collect vehicle, year, damage description, drivability, insurance/claim, photos and contact information when appropriate. Context: ${context||"no context"}`;
    const response=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},signal:AbortSignal.timeout(15000),body:JSON.stringify({model:process.env.GROQ_MODEL||"llama-3.3-70b-versatile",temperature:.3,messages:[{role:"system",content:system},{role:"user",content:message}]})});
    if(!response.ok)throw new Error("AI provider unavailable");const data=await response.json();return NextResponse.json({reply:data.choices?.[0]?.message?.content||fallback,language});
  }catch(error){return apiError(error)}
}
