import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedCompanyId } from "@/lib/internal-auth";
import { buildRepairSms, REPAIR_STAGES, RepairStageKey } from "@/lib/repair-stages";
import { sendSmsText } from "@/lib/sms";

const stageKeys = REPAIR_STAGES.map((stage) => stage.key) as [RepairStageKey, ...RepairStageKey[]];
const schema = z.object({ stage: z.enum(stageKeys), notifyCustomer: z.boolean().default(true), message: z.string().min(1).max(1200).optional() });
export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getAuthenticatedCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const input = schema.parse(await request.json());
    const admin = createAdminClient();

    const { data: repairCase, error: caseError } = await admin
      .from("collision_cases")
      .select(`id, company_id, case_number, preferred_language,
        contacts:contacts!collision_cases_contact_id_fkey(id, full_name, phone, preferred_language),
        vehicles:vehicles!collision_cases_vehicle_id_fkey(year, make, model)`)
      .eq("id", id)
      .eq("company_id", companyId)
      .single();
    if (caseError || !repairCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    const contact = Array.isArray(repairCase.contacts) ? repairCase.contacts[0] : repairCase.contacts;
    const vehicle = Array.isArray(repairCase.vehicles) ? repairCase.vehicles[0] : repairCase.vehicles;
    const preferredLanguage = ((contact?.preferred_language || repairCase.preferred_language || "en") === "es" ? "es" : "en") as "en" | "es";
    const vehicleLabel = [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
    const message = input.message || buildRepairSms({ stage: input.stage, customerName: contact?.full_name, vehicle: vehicleLabel, language: preferredLanguage });

    let smsStatus = "not_requested";
    let smsSid: string | null = null;
    let notifiedAt: string | null = null;
    if (input.notifyCustomer) {
      if (!contact?.phone) return NextResponse.json({ error: "Customer phone number is missing" }, { status: 400 });
      const result = await sendSmsText(contact.phone, message) as { sid?: string };
      smsStatus = "sent";
      smsSid = result.sid || null;
      notifiedAt = new Date().toISOString();

      let { data: conversation } = await admin.from("conversations").select("id")
        .eq("company_id", companyId).eq("channel", "sms").eq("external_contact_id", contact.phone).maybeSingle();
      if (!conversation) {
        const created = await admin.from("conversations").insert({ company_id: companyId, contact_id: contact.id || null, channel: "sms", external_contact_id: contact.phone, status: "open", preferred_language: preferredLanguage, last_message_at: notifiedAt }).select("id").single();
        conversation = created.data;
      }
      if (conversation?.id) {
        await admin.from("messages").insert({ company_id: companyId, conversation_id: conversation.id, direction: "outbound", external_id: smsSid, body: message, message_type: "text", detected_language: preferredLanguage, raw_payload: { source: "repair_progress", case_id: id, stage: input.stage } });
        await admin.from("conversations").update({ last_message_at: notifiedAt }).eq("id", conversation.id);
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await admin.from("collision_cases").update({ status: input.stage, updated_at: now }).eq("id", id).eq("company_id", companyId);
    if (updateError) throw updateError;

    const { data: update, error: repairUpdateError } = await admin.from("repair_updates").insert({
      company_id: companyId,
      case_id: id,
      stage: input.stage,
      note: null,
      customer_visible: input.notifyCustomer,
      customer_message: message,
      sms_status: smsStatus,
      sms_sid: smsSid,
      notified_at: notifiedAt,
    }).select("id,stage,customer_message,sms_status,sms_sid,notified_at,created_at").single();
    if (repairUpdateError) throw repairUpdateError;

    return NextResponse.json({ ok: true, stage: input.stage, message, update });
  } catch (error) {
    console.error("Repair stage update error", error);
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid stage update" }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update repair stage" }, { status: 500 });
  }
}
