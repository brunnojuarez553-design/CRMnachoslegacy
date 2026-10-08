import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMetaSignature } from "@/lib/meta";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode"); const token = url.searchParams.get("hub.verify_token"); const challenge = url.searchParams.get("hub.challenge");
  if (process.env.META_VERIFY_TOKEN && mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) return new NextResponse(challenge || "", { status: 200 });
  return new NextResponse("Forbidden", { status: 403 });
}
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"))) return new NextResponse("Invalid signature", { status: 401 });
  const payload = JSON.parse(raw); const admin = createAdminClient();
  await admin.from("webhook_events").insert({ provider:"whatsapp", event_type:"messages", payload });
  for (const entry of payload.entry || []) for (const change of entry.changes || []) {
    const value = change.value || {}; const phoneNumberId = value.metadata?.phone_number_id;
    for (const message of value.messages || []) {
      const from = message.from; const body = message.text?.body || `[${message.type}]`;
      const { data: connection } = await admin.from("channel_connections").select("company_id,id").eq("provider","whatsapp").eq("external_account_id",phoneNumberId).maybeSingle();
      if (!connection) continue;
      let { data: conversation } = await admin.from("conversations").select("id").eq("company_id",connection.company_id).eq("external_contact_id",from).eq("channel","whatsapp").maybeSingle();
      if (!conversation) { const created = await admin.from("conversations").insert({ company_id:connection.company_id, channel:"whatsapp", external_contact_id:from, status:"open" }).select("id").single(); conversation=created.data; }
      if (conversation) await admin.from("messages").insert({ company_id:connection.company_id, conversation_id:conversation.id, direction:"inbound", external_id:message.id, body, message_type:message.type, raw_payload:message });
    }
  }
  return NextResponse.json({ received:true });
}
