import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMetaSignature } from "@/lib/meta";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === process.env.META_VERIFY_TOKEN) return new NextResponse(url.searchParams.get("hub.challenge") || "");
  return new NextResponse("Forbidden",{status:403});
}
export async function POST(request: Request) {
  const raw=await request.text(); if(!verifyMetaSignature(raw,request.headers.get("x-hub-signature-256"))) return new NextResponse("Invalid signature",{status:401});
  const payload=JSON.parse(raw); const admin=createAdminClient(); await admin.from("webhook_events").insert({provider:"instagram",event_type:"messaging",payload});
  for(const entry of payload.entry||[]){
    const accountId=String(entry.id||"");
    for(const event of entry.messaging||[]){
      const senderId=String(event.sender?.id||""); const message=event.message; if(!senderId||!message) continue;
      const body=message.text||`[${message.attachments?.[0]?.type||"message"}]`;
      const {data:connection}=await admin.from("channel_connections").select("company_id,id").eq("provider","instagram").eq("external_account_id",accountId).maybeSingle();
      if(!connection) continue;
      let {data:contact}=await admin.from("contacts").select("id").eq("company_id",connection.company_id).eq("instagram_id",senderId).maybeSingle();
      if(!contact){const created=await admin.from("contacts").insert({company_id:connection.company_id,instagram_id:senderId,full_name:"Instagram lead"}).select("id").single();contact=created.data;}
      let {data:conversation}=await admin.from("conversations").select("id").eq("company_id",connection.company_id).eq("external_contact_id",senderId).eq("channel","instagram").maybeSingle();
      if(!conversation){const created=await admin.from("conversations").insert({company_id:connection.company_id,contact_id:contact?.id||null,channel:"instagram",external_contact_id:senderId,status:"open"}).select("id").single();conversation=created.data;}
      if(conversation) await admin.from("messages").insert({company_id:connection.company_id,conversation_id:conversation.id,direction:"inbound",external_id:message.mid||null,body,message_type:"text",raw_payload:event});
    }
  }
  return NextResponse.json({received:true});
}
