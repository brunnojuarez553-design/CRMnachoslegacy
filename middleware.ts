import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(new URL("/login?setup=required", request.url));
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  const protectedPaths = ["/calls","/leads","/dashboard","/collision-center","/customers","/vehicles","/estimates","/repair-board","/conversations","/calendar","/growth","/settings"];
  if (!user && protectedPaths.some(p=>request.nextUrl.pathname.startsWith(p))) return NextResponse.redirect(new URL("/login", request.url));
  return response;
}
export const config = { matcher: ["/calls/:path*","/leads/:path*","/dashboard/:path*","/collision-center/:path*","/customers/:path*","/vehicles/:path*","/estimates/:path*","/repair-board/:path*","/conversations/:path*","/calendar/:path*","/growth/:path*","/settings/:path*"] };
