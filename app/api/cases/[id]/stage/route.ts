import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, ApiError } from "@/lib/internal-auth";
import { apiError } from "@/lib/api";
import { REPAIR_STAGES, RepairStageKey, buildRepairSms } from "@/lib/repair-stages";
import { smsReady } from "@/lib/config";
import { sendSmsText } from "@/lib/sms";
const schema=z.object({requestId:z.string().uuid(),stage:z.enum(REPAIR_STAGES.map(s=>s.key) as [RepairStageKey,...RepairStageKey[]]),notifyCustomer:z.boolean().default(false),message:z.string().trim().min(1).max(1200).optional()});
export async function POST(request:Request,context:{params:Promise<{id:string}>}) {
  try {
    const {supabase,company}=await requireWorkspace();const {id}=await context.params;z.string().uuid().parse(id);const input=schema.parse(await request.json());
    if(input.notifyCustomer&&!smsReady())throw new ApiError(409,"Twilio is not configured. Save progress without sending an SMS.");
    const {data:row,error}=await supabase.from("collision_cases").select("*,contacts:contacts!collision_cases_contact_id_fkey(*),vehicles:vehicles!collision_cases_vehicle_id_fkey(*)").eq("company_id",company.id).eq("id",id).single();if(error||!row)throw new ApiError(404,"Case not found");
    const contact=Array.isArray(row.contacts)?row.contacts[0]:row.contacts;const vehicle=Array.isArray(row.vehicles)?row.vehicles[0]:row.vehicles;
    if(input.notifyCustomer&&!contact?.phone)throw new ApiError(400,"Customer phone is missing");
    const message=input.message||buildRepairSms({stage:input.stage,customerName:contact?.full_name,vehicle:[vehicle?.year,vehicle?.make,vehicle?.model].filter(Boolean).join(" "),language:row.preferred_language==="es"?"es":"en"});
    const {data:result,error:saveError}=await supabase.rpc("save_nachos_progress",{p_company_id:company.id,p_case_id:id,p_request_id:input.requestId,p_stage:input.stage,p_message:message,p_notify:input.notifyCustomer});if(saveError)throw saveError;
    let warning:string|undefined;
    if(input.notifyCustomer&&!result.duplicate){
      try {const sent=await sendSmsText(contact.phone,message);const {error:logError}=await supabase.rpc("record_nachos_sms",{p_company_id:company.id,p_update_id:result.update.id,p_sid:sent.sid,p_status:sent.status||"queued"});if(logError){console.error("SMS log failed",logError);warning="Progress saved; provider accepted SMS but delivery logging needs review.";}else{result.update.sms_status=sent.status||"queued";result.update.sms_sid=sent.sid;}}
      catch(error){console.error("SMS failed",error);const {error:logError}=await supabase.from("repair_updates").update({sms_status:"failed"}).eq("company_id",company.id).eq("id",result.update.id);if(logError)console.error(logError);result.update.sms_status="failed";warning="Progress saved. SMS could not be confirmed; check Twilio before sending again.";}
    }
    return NextResponse.json({ok:true,mode:"live",...result,stage:input.stage,warning});
  }catch(error){return apiError(error);}
}
