import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace,ApiError } from "@/lib/internal-auth";
import { apiError } from "@/lib/api";
import { smsReady } from "@/lib/config";
import { sendSmsText } from "@/lib/sms";
const schema=z.object({conversationId:z.string().uuid(),body:z.string().trim().min(1).max(1200)});
export async function POST(request:Request){try{
 const{company,supabase}=await requireWorkspace();const input=schema.parse(await request.json());const{data:conversation,error}=await supabase.from("conversations").select("*").eq("company_id",company.id).eq("id",input.conversationId).single();if(error||!conversation)throw new ApiError(404,"Conversation not found");
 if(conversation.channel!=="sms")throw new ApiError(409,"Sending is only enabled for configured SMS conversations");if(!smsReady())throw new ApiError(409,"Twilio is not configured yet");
 const result=await sendSmsText(conversation.external_contact_id,input.body);
 const{error:messageError}=await supabase.from("messages").insert({company_id:company.id,conversation_id:conversation.id,direction:"outbound",external_id:result.sid,body:input.body,message_type:"text",raw_payload:{status:result.status}});
 if(messageError){console.error("Provider accepted SMS but log failed",messageError);return NextResponse.json({ok:true,warning:"SMS accepted by provider; history could not be saved. Do not resend."});}
 const{error:updateError}=await supabase.from("conversations").update({last_message_at:new Date().toISOString()}).eq("company_id",company.id).eq("id",conversation.id);if(updateError)console.error(updateError);
 return NextResponse.json({ok:true,status:result.status||"queued"});
}catch(error){return apiError(error);}}
