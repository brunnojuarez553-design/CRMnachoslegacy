"use client";

import { Download } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export type ExportColumn<T> = { key: keyof T | string; label: string; value?: (row: T) => unknown };

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCsv<T>(rows: readonly T[], columns: readonly ExportColumn<T>[], filename: string) {
  const header = columns.map(c => csvEscape(c.label)).join(",");
  const lines = rows.map(row => columns.map(c => csvEscape(c.value ? c.value(row) : (row as unknown as Record<string, unknown>)[String(c.key)])).join(","));
  download(filename.endsWith(".csv") ? filename : `${filename}.csv`, `\ufeff${[header, ...lines].join("\r\n")}`, "text/csv;charset=utf-8");
}

export default function ExportButton<T>({ rows, columns, filename, compact = false }: { rows: readonly T[]; columns: readonly ExportColumn<T>[]; filename: string; compact?: boolean }) {
  const { language } = useLanguage();
  return <button type="button" className={compact ? "export-button compact" : "export-button"} onClick={() => exportCsv(rows, columns, filename)} title={language === "es" ? "Descargar datos ordenados en CSV" : "Download organized CSV data"}>
    <Download size={15}/><span>{compact ? (language === "es" ? "Exportar" : "Export") : (language === "es" ? "Exportar CSV" : "Export CSV")}</span>
  </button>;
}

export function RecordExportButton<T>({ row, columns, filename }: { row: T; columns: readonly ExportColumn<T>[]; filename: string }) {
  const { language } = useLanguage();
  return <button type="button" className="record-export" onClick={(e) => { e.stopPropagation(); exportCsv([row], columns, filename); }} aria-label={language === "es" ? "Exportar ficha" : "Export record"} title={language === "es" ? "Exportar ficha" : "Export record"}>
    <Download size={14}/>
  </button>;
}
