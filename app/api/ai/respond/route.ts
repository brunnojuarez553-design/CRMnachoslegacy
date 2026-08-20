import { NextResponse } from "next/server";
import { z } from "zod";
const schema=z.object({message:z.string().min(1),context:z.string().optional(),language:z.enum(["en","es"]).default("en")});
export async function POST(request:Request){
  try{
    const {message,context,language}=schema.parse(await request.json()); const key=process.env.GROQ_API_KEY;
    const fallback=language==="es"?"Gracias por escribirnos. Para poder ayudarte, indicame marca, modelo, año, qué ocurrió y un teléfono de contacto.":"Thanks for reaching out. To help you, please send the vehicle make, model, year, what happened, and a contact phone number.";
    if(!key)return NextResponse.json({reply:fallback,mode:"fallback",language});
    const system=language==="es"
      ?`Sos Legacy Intelligence, el asistente de Nacho's Legacy Body Shop en Pennsylvania. Respondé siempre en español, de forma humana, clara y breve. Ayudá con consultas de colisión, carrocería, pintura y seguros. No diagnostiques daños estructurales ni confirmes precios sin revisión humana. Recolectá vehículo, año, descripción del daño, si puede circular, seguro/claim, fotos y datos de contacto cuando corresponda. Contexto: ${context||"sin contexto"}`
      :`You are Legacy Intelligence, the assistant for Nacho's Legacy Body Shop in Pennsylvania. Always reply in English, in a clear, human and concise tone. Help with collision, body, paint and insurance inquiries. Never diagnose structural damage or confirm pricing without human review. Collect vehicle, year, damage description, drivability, insurance/claim, photos and contact information when appropriate. Context: ${context||"no context"}`;
    const response=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.GROQ_MODEL||"llama-3.3-70b-versatile",temperature:.3,messages:[{role:"system",content:system},{role:"user",content:message}]})});
    if(!response.ok)throw new Error(await response.text());const data=await response.json();return NextResponse.json({reply:data.choices?.[0]?.message?.content||fallback,language});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unknown error"},{status:400})}
}
