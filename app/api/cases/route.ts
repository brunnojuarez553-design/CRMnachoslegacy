import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/internal-auth";
import { apiError } from "@/lib/api";
import { smsReady } from "@/lib/config";
export const dynamic="force-dynamic";
export async function GET() {
  try { const {supabase,company}=await requireWorkspace(); let rows: unknown[]=[];
    for(let offset=0;;offset+=500){const {data,error}=await supabase.from("collision_cases").select("*, contacts:contacts!collision_cases_contact_id_fkey(*), vehicles:vehicles!collision_cases_vehicle_id_fkey(*), case_photos(*), repair_updates(*)").eq("company_id",company.id).order("created_at",{ascending:false}).order("id").range(offset,offset+499);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<500)break;}
    return NextResponse.json({cases:rows,mode:"live",smsReady:smsReady()},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiError(error); }
}
export async function POST(request: Request) {
  try { const {company}=await requireWorkspace();const {Intake,saveIntake}=await import("@/lib/intake");const {createAdminClient}=await import("@/lib/supabase/admin");const body=Intake.parse(await request.json());return NextResponse.json({ok:true,...await saveIntake(createAdminClient(),company.id,body)},{status:201}); }catch(error){return apiError(error);}
}
