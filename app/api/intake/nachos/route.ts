import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const Photo = z.object({ url: z.string().url(), publicId: z.string().optional() });
const Intake = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(6).max(40),
  email: z.string().email().optional().or(z.literal("")),
  vehicle: z.object({ year: z.coerce.number().int().min(1950).max(2100).optional(), make: z.string().max(80).optional(), model: z.string().max(80).optional(), raw: z.string().max(180).optional() }),
  intakeType: z.enum(["collision","body_paint","insurance"]).default("collision"),
  preferredLanguage: z.enum(["en","es"]).default("en"),
  drivable: z.boolean().optional(),
  damageArea: z.string().max(120).optional(),
  description: z.string().max(3000).optional(),
  vehicleLocation: z.string().max(240).optional(),
  insuranceCompany: z.string().max(120).optional(),
  hasClaim: z.boolean().optional(),
  claimNumber: z.string().max(120).optional(),
  photos: z.array(Photo).max(10).default([]),
  attribution: z.object({ source: z.string().max(80).optional(), medium: z.string().max(80).optional(), campaign: z.string().max(120).optional(), landing: z.string().max(200).optional(), referrer: z.string().max(500).optional(), utm_source: z.string().max(120).optional(), utm_medium: z.string().max(120).optional(), utm_campaign: z.string().max(120).optional() }).optional()
});

function corsHeaders(origin: string | null) {
  const allowed = (process.env.INTAKE_ALLOWED_ORIGINS || "https://landingnachoslegacy.vercel.app").split(",").map(x=>x.trim());
  const value = origin && allowed.includes(origin) ? origin : allowed[0];
  return { "Access-Control-Allow-Origin": value, "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
}

export async function OPTIONS(req: NextRequest) { return new NextResponse(null,{status:204,headers:corsHeaders(req.headers.get("origin"))}); }

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const body = Intake.parse(await req.json());
    const supabase = createAdminClient();
    const slug = process.env.NACHOS_COMPANY_SLUG || "nachos-legacy";
    const { data: company, error: companyError } = await supabase.from("companies").select("id").eq("slug", slug).single();
    if (companyError || !company) return NextResponse.json({error:"Workspace not configured"},{status:500,headers});

    let contactId: string | null = null;
    const { data: existing } = await supabase.from("contacts").select("id").eq("company_id",company.id).eq("phone",body.phone).maybeSingle();
    if (existing?.id) contactId = existing.id;
    else {
      const { data: contact, error } = await supabase.from("contacts").insert({company_id:company.id,full_name:body.name,phone:body.phone,email:body.email||null,preferred_language:body.preferredLanguage}).select("id").single();
      if (error) throw error; contactId = contact.id;
    }

    if (existing?.id) await supabase.from("contacts").update({preferred_language:body.preferredLanguage}).eq("id",contactId);

    const { data: vehicle, error: vehicleError } = await supabase.from("vehicles").insert({company_id:company.id,contact_id:contactId,year:body.vehicle.year||null,make:body.vehicle.make||null,model:body.vehicle.model||body.vehicle.raw||null}).select("id").single();
    if (vehicleError) throw vehicleError;

    const caseNumber = `NL-${Date.now().toString().slice(-6)}`;
    const a = body.attribution || {};
    const { data: collisionCase, error: caseError } = await supabase.from("collision_cases").insert({company_id:company.id,contact_id:contactId,vehicle_id:vehicle.id,case_number:caseNumber,intake_type:body.intakeType,status:"new_intake",damage_area:body.damageArea||null,damage_description:body.description||null,drivable:body.drivable??null,vehicle_location:body.vehicleLocation||null,insurance_company:body.insuranceCompany||null,has_claim:body.hasClaim??null,claim_number:body.claimNumber||null,source:a.source||"instagram_bio",medium:a.medium||"landing",campaign:a.campaign||null,landing:a.landing||"landingnachoslegacy",referrer:a.referrer||null,utm_source:a.utm_source||null,utm_medium:a.utm_medium||null,utm_campaign:a.utm_campaign||null,priority:body.drivable===false?"high":"normal",preferred_language:body.preferredLanguage}).select("id,case_number").single();
    if (caseError) throw caseError;

    if (body.photos.length) {
      const photoRows = body.photos.map((p,i)=>({company_id:company.id,case_id:collisionCase.id,url:p.url,public_id:p.publicId||null,stage:"intake",sort_order:i}));
      const { error } = await supabase.from("case_photos").insert(photoRows); if (error) throw error;
    }

    await supabase.from("leads").insert({company_id:company.id,contact_id:contactId,status:"new",source:a.source||"instagram_bio",service_interest:body.intakeType,vehicle_summary:[body.vehicle.year,body.vehicle.make,body.vehicle.model||body.vehicle.raw].filter(Boolean).join(" "),score:body.drivable===false?92:78,ai_summary:`${body.intakeType} intake · ${body.damageArea||"damage not specified"} · ${body.photos.length} photos${body.insuranceCompany?` · ${body.insuranceCompany}`:""}`});

    return NextResponse.json({ok:true,caseId:collisionCase.id,caseNumber:collisionCase.case_number,message:body.preferredLanguage==="es"?"Evaluación recibida":"Evaluation received",language:body.preferredLanguage},{status:201,headers});
  } catch (error) {
    console.error("Nachos intake error",error);
    return NextResponse.json({error:"Invalid or incomplete intake"},{status:400,headers});
  }
}
