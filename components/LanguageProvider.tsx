"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "es";
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; toggleLanguage: () => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "nachos-legacy-language";

export function LanguageProvider({ children, initialLanguage = "en" }: { children: React.ReactNode; initialLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  useEffect(() => { document.documentElement.lang = language; window.localStorage.setItem(STORAGE_KEY, language); }, [language]);
  const persist = useCallback((next: Language) => {
    setLanguageState(next);
    document.cookie = `nl-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, []);
  const toggleLanguage = useCallback(() => persist(language === "en" ? "es" : "en"), [language, persist]);
  const value = useMemo(() => ({ language, setLanguage: persist, toggleLanguage }), [language, persist, toggleLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { const context = useContext(LanguageContext); if (!context) throw new Error("useLanguage must be used inside LanguageProvider"); return context; }
