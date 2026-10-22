import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/internal-auth";
import { apiError } from "@/lib/api";
import { smsReady } from "@/lib/config";
const tables=["contacts","vehicles","collision_cases","case_photos","repair_updates","leads","estimates","appointments","conversations","messages","phone_call_logs"];
export const dynamic="force-dynamic";
export async function GET(){try{
 const {supabase,company}=await requireWorkspace();const entries=await Promise.all(tables.map(async table=>{let rows:unknown[]=[];for(let offset=0;;offset+=500){const{data,error}=await supabase.from(table).select("*").eq("company_id",company.id).order("created_at",{ascending:false}).order("id").range(offset,offset+499);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<500)break;}return [table,rows] as const;}));
 return NextResponse.json({company,...Object.fromEntries(entries),integrations:{sms:smsReady(),ai:Boolean(process.env.GROQ_API_KEY),intake:Boolean(process.env.INTAKE_SHARED_SECRET)}},{headers:{"Cache-Control":"no-store"}});
}catch(error){return apiError(error);}}
