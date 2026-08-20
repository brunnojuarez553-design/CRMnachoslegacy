import DashboardClient from "@/components/DashboardClient";
import { createClient } from "@/lib/supabase/server";
export default async function DashboardPage() {
  let email = "Administrador";
  try { const supabase = await createClient(); const { data } = await supabase.auth.getUser(); email = data.user?.email || email; } catch {}
  return <DashboardClient email={email}/>;
}
