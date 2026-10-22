import { z } from "zod";
export function normalizePhone(value: string) {
  let digits = value.replace(/[^0-9]/g, "");
  if (digits.length === 10 && !value.trim().startsWith("+")) digits = "1" + digits;
  return digits ? "+" + digits : "";
}
const phone = z.string().trim().transform(normalizePhone).refine(v => /^\+[1-9]\d{6,14}$/.test(v), "Use a valid phone number with country code");
const optionalText = (n: number) => z.string().trim().max(n).optional();
export const Intake = z.object({
  submissionId: z.string().uuid(), name: z.string().trim().min(2).max(120),
  phone: phone.optional().or(z.literal("")), email: z.string().trim().email().max(254).optional().or(z.literal("")),
  vehicle: z.object({year:z.coerce.number().int().min(1950).max(2100).optional(),make:optionalText(80),model:optionalText(80),raw:optionalText(180),vin:optionalText(40)}),
  intakeType:z.enum(["collision","body_paint","insurance"]).default("collision"), preferredLanguage:z.enum(["en","es"]).default("en"),
  drivable:z.boolean().optional(), damageArea:optionalText(120), description:optionalText(3000), vehicleLocation:optionalText(240), insuranceCompany:optionalText(120),hasClaim:z.boolean().optional(),claimNumber:optionalText(120),
  photos:z.array(z.object({url:z.string().url().max(2000).refine(v=>v.startsWith("https://"),"HTTPS photos only"),publicId:optionalText(250)})).max(10).default([]),
  attribution:z.object({source:optionalText(80),medium:optionalText(80),campaign:optionalText(120),landing:optionalText(500),referrer:optionalText(500),utm_source:optionalText(120),utm_medium:optionalText(120),utm_campaign:optionalText(120)}).optional()
}).refine(v=>Boolean(v.phone || v.email),{message:"Phone or email is required",path:["phone"]}).refine(v=>Boolean(v.vehicle.raw || v.vehicle.model || v.vehicle.make),{message:"Vehicle is required",path:["vehicle"]});
export const defaultOrigins = ["https://www.nachoslegacy.com","https://nachoslegacy.com","https://nacholegacy.vercel.app","https://landingnachoslegacy.vercel.app"];
export function allowedOrigins() { return (process.env.INTAKE_ALLOWED_ORIGINS || defaultOrigins.join(",")).split(",").map(v=>v.trim()).filter(Boolean); }
export async function saveIntake(supabase: ReturnType<typeof import("./supabase/admin").createAdminClient>, companyId: string, body: z.infer<typeof Intake>) {
  const {data,error} = await supabase.rpc("create_nachos_intake", {p_company_id:companyId,p_payload:body});
  if (error) throw error;
  return data as {caseId:string;caseNumber:string;duplicate:boolean};
}
