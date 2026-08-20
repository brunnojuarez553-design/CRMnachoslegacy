import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedCompanyId } from "@/lib/internal-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const companyId = await getAuthenticatedCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("collision_cases")
      .select(`
        id, case_number, intake_type, status, damage_area, damage_description,
        drivable, vehicle_location, insurance_company, has_claim, claim_number,
        source, medium, campaign, landing, priority, preferred_language, created_at, updated_at,
        contacts:contacts!collision_cases_contact_id_fkey(id, full_name, phone, email, preferred_language),
        vehicles:vehicles!collision_cases_vehicle_id_fkey(id, year, make, model, vin, plate),
        case_photos(id, url, stage, sort_order, created_at),
        repair_updates(id, stage, note, customer_visible, customer_message, sms_status, sms_sid, notified_at, created_at)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ cases: data || [] });
  } catch (error) {
    console.error("Cases API error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load cases" }, { status: 500 });
  }
}
