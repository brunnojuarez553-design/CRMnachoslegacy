import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api";
import { ApiError } from "@/lib/internal-auth";
import { Intake, allowedOrigins, saveIntake } from "@/lib/intake";
function headers(origin: string | null): Record<string,string> { return origin && allowedOrigins().includes(origin) ? {"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Vary":"Origin"} : {"Vary":"Origin"}; }
export async function OPTIONS(req: NextRequest) { const origin=req.headers.get("origin"); return new NextResponse(null,{status:origin && allowedOrigins().includes(origin)?204:403,headers:headers(origin)}); }
export async function POST(req: NextRequest) {
  const origin=req.headers.get("origin");const cors=headers(origin);
  try {
    const expected=process.env.INTAKE_SHARED_SECRET;const provided=req.headers.get("x-intake-secret") || "";
    const trusted=Boolean(expected && Buffer.byteLength(expected)===Buffer.byteLength(provided) && timingSafeEqual(Buffer.from(expected),Buffer.from(provided)));
    if (!trusted) throw new ApiError(403,"Website integration is not authorized");
    const text=await req.text();if(Buffer.byteLength(text)>40000)throw new ApiError(413,"Intake too large");
    const body=Intake.parse(JSON.parse(text));const admin=createAdminClient();
    const {data:company,error}=await admin.from("companies").select("id").eq("slug",process.env.NACHOS_COMPANY_SLUG||"nachos-legacy").single();
    if(error||!company)throw new ApiError(503,"Workspace is not configured");
    const saved=await saveIntake(admin,company.id,body);
    return NextResponse.json({ok:true,...saved,language:body.preferredLanguage},{status:saved.duplicate?200:201,headers:cors});
  } catch(error) { const result=apiError(error);Object.entries(cors).forEach(([k,v])=>result.headers.set(k,v));return result; }
}
