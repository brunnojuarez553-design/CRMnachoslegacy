import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedCompanyId } from "@/lib/internal-auth";

export const runtime = "nodejs";

const demoCases = [
  {
    id: "demo-nl-0184",
    case_number: "NL-0184",
    intake_type: "collision",
    status: "insurance_review",
    damage_area: "Rear bumper / quarter panel",
    damage_description: "Customer was rear-ended at a traffic light. Vehicle is drivable. Uploaded photos from the quick evaluation form.",
    drivable: true,
    vehicle_location: "Customer home - Lansdowne, PA",
    insurance_company: "GEICO",
    has_claim: true,
    claim_number: "GEI-842193",
    source: "instagram",
    medium: "bio_landing",
    campaign: "quick_damage_evaluation",
    landing: "landingnachoslegacy.vercel.app",
    priority: "high",
    preferred_language: "en",
    created_at: new Date(Date.now()-1000*60*90).toISOString(),
    updated_at: new Date(Date.now()-1000*60*30).toISOString(),
    contacts: { id:"demo-contact-1", full_name:"Maria Rodriguez", phone:"+1 610 555 0184", email:"maria@example.com", preferred_language:"en" },
    vehicles: { id:"demo-vehicle-1", year:2022, make:"Honda", model:"Accord", vin:"1HGCV1F3XNA000184", plate:"PA DEMO1" },
    case_photos: [],
    repair_updates: [
      { id:"demo-update-1", stage:"vehicle_received", customer_message:"Hi Maria, your 2022 Honda Accord has been received at Nacho's Legacy. We'll keep you updated as the repair progresses.", sms_status:"sent", sms_sid:"DEMO-SMS-001", notified_at:new Date(Date.now()-1000*60*60*24).toISOString(), created_at:new Date(Date.now()-1000*60*60*24).toISOString() }
    ]
  },
  {
    id: "demo-nl-0185",
    case_number: "NL-0185",
    intake_type: "collision",
    status: "estimate",
    damage_area: "Front end",
    damage_description: "Front-end impact. Customer contacted the shop by text and sent vehicle details for an estimate.",
    drivable: false,
    vehicle_location: "Tow yard",
    insurance_company: "State Farm",
    has_claim: true,
    claim_number: "SF-550291",
    source: "sms",
    medium: "text_message",
    campaign: null,
    landing: null,
    priority: "high",
    preferred_language: "en",
    created_at: new Date(Date.now()-1000*60*60*5).toISOString(),
    updated_at: new Date(Date.now()-1000*60*60).toISOString(),
    contacts: { id:"demo-contact-2", full_name:"John Miller", phone:"+1 610 555 0185", email:"john@example.com", preferred_language:"en" },
    vehicles: { id:"demo-vehicle-2", year:2021, make:"Ford", model:"F-150", vin:"1FTFW1E50MFA00185", plate:"PA DEMO2" },
    case_photos: [],
    repair_updates: []
  }
];

export async function GET() {
  const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!supabaseReady) return NextResponse.json({ cases: demoCases, mode: "demo" });

  try {
    const companyId = await getAuthenticatedCompanyId();
    if (!companyId) return NextResponse.json({ cases: demoCases, mode: "demo" });
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
    return NextResponse.json({ cases: data || [], mode: "live" });
  } catch (error) {
    console.error("Cases API error", error);
    return NextResponse.json({ cases: demoCases, mode: "demo" });
  }
}
