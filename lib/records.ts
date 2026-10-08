import { z } from "zod";
import { normalizePhone } from "./intake";
const phone=z.string().trim().transform(normalizePhone).refine(v=>/^\+[1-9]\d{6,14}$/.test(v),"Use a valid phone number").or(z.literal("")).nullable().optional();
const text=(n=240)=>z.string().trim().max(n).nullable().optional();
const fk=z.string().uuid().nullable().optional();
const email=z.string().trim().email().max(254).or(z.literal("")).nullable().optional();
export const recordSchemas = {
 contacts:z.object({full_name:z.string().trim().min(2).max(120),phone,email,preferred_language:z.enum(["en","es"]).default("en")}),
 vehicles:z.object({contact_id:fk,year:z.number().int().min(1950).max(2100).nullable().optional(),make:text(80),model:text(180),vin:text(40),plate:text(30),color:text(40),mileage:z.number().int().nonnegative().nullable().optional()}),
 leads:z.object({contact_id:fk,status:z.enum(["new","contacted","qualified","converted","lost"]),source:text(80),service_interest:text(120),vehicle_summary:text(180),estimated_value:z.number().nonnegative().max(1e9).nullable().optional(),ai_summary:text(3000)}),
 estimates:z.object({case_id:z.string().uuid(),estimate_number:z.string().trim().min(1).max(80),status:z.enum(["draft","sent","accepted","declined"]),subtotal:z.number().nonnegative().max(1e9),tax:z.number().nonnegative().max(1e9),valid_until:z.string().date().nullable().optional()}),
 appointments:z.object({case_id:fk,title:z.string().trim().min(2).max(240),appointment_type:z.enum(["inspection","drop_off","pickup","other"]),starts_at:z.string().datetime({offset:true}),ends_at:z.string().datetime({offset:true}).nullable().optional(),status:z.enum(["scheduled","completed","cancelled"])}).refine(v=>!v.ends_at||new Date(v.ends_at)>new Date(v.starts_at),{message:"End must be after start",path:["ends_at"]}),
 phone_call_logs:z.object({contact_id:fk,case_id:fk,direction:z.enum(["inbound","outbound"]),phone,summary:text(3000),outcome:text(120),duration_seconds:z.number().int().nonnegative().nullable().optional()}),
};
export type RecordTable=keyof typeof recordSchemas;
