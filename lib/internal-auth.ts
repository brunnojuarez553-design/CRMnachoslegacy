import { createClient } from "@/lib/supabase/server";
import { databaseReady } from "@/lib/config";
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function requireWorkspace() {
  if (!databaseReady()) throw new ApiError(503, "CRM database is not configured");
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ApiError(401, "Please sign in again");
  const { data: company, error: companyError } = await supabase.from("companies").select("id,name,slug,timezone,currency").eq("slug", process.env.NACHOS_COMPANY_SLUG || "nachos-legacy").maybeSingle();
  if (companyError) throw new ApiError(503, "Unable to load workspace");
  if (!company) throw new ApiError(403, "Your account is not assigned to Nacho's Legacy");
  return { supabase, company, user };
}
export async function getAuthenticatedCompanyId() { try { return (await requireWorkspace()).company.id as string; } catch { return null; } }
