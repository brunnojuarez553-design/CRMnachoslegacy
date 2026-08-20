import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const runtime="nodejs";

export async function POST(request:Request){
  const form=await request.formData();
  const from=String(form.get("From")||"");
  const to=String(form.get("To")||"");
  const body=String(form.get("Body")||"");
  const externalId=String(form.get("MessageSid")||"");
  if(!from||!to) return new NextResponse("Bad Request",{status:400});
  const admin=createAdminClient();
  await admin.from("webhook_events").insert({provider:"sms",event_type:"message",payload:Object.fromEntries(form.entries())});
  const {data:connection}=await admin.from("channel_connections").select("company_id,id").eq("provider","sms").eq("external_account_id",to).maybeSingle();
  if(!connection) return new NextResponse("OK",{status:200,headers:{"Content-Type":"text/plain"}});
  let {data:contact}=await admin.from("contacts").select("id").eq("company_id",connection.company_id).eq("phone",from).maybeSingle();
  if(!contact){const created=await admin.from("contacts").insert({company_id:connection.company_id,phone:from,full_name:from}).select("id").single(); contact=created.data;}
  let {data:conversation}=await admin.from("conversations").select("id").eq("company_id",connection.company_id).eq("external_contact_id",from).eq("channel","sms").maybeSingle();
  if(!conversation){const created=await admin.from("conversations").insert({company_id:connection.company_id,contact_id:contact?.id||null,channel:"sms",external_contact_id:from,status:"open"}).select("id").single();conversation=created.data;}
  if(conversation) await admin.from("messages").insert({company_id:connection.company_id,conversation_id:conversation.id,direction:"inbound",external_id:externalId||null,body,message_type:"text",raw_payload:Object.fromEntries(form.entries())});
  return new NextResponse("OK",{status:200,headers:{"Content-Type":"text/plain"}});
}
