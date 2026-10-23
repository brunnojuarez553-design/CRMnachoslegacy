import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import "./brand.css";
import { LanguageProvider, type Language } from "@/components/LanguageProvider";

export const metadata: Metadata = { title: "Nacho's Legacy | Collision OS", description: "Bilingual collision CRM, repair operations and growth platform for Nacho's Legacy Body Shop." };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  const saved = store.get("nl-language")?.value;
  const initialLanguage: Language = saved === "es" ? "es" : "en";
  return <html lang={initialLanguage}><body><LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider></body></html>;
}
