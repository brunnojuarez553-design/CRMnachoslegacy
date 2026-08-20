"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export default function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div className={`language-switch ${compact ? "compact" : ""}`} role="group" aria-label={language === "es" ? "Cambiar idioma" : "Change language"}>
      {!compact && <Languages size={16} aria-hidden="true" />}
      <button type="button" className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
      <span aria-hidden="true" />
      <button type="button" className={language === "es" ? "selected" : ""} onClick={() => setLanguage("es")} aria-pressed={language === "es"}>ES</button>
    </div>
  );
}
