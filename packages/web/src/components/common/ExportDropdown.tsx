import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

interface Props {
  onExcel: () => void;
  onPdf: () => void;
  loading?: boolean;
}

export function ExportDropdown({ onExcel, onPdf, loading }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border border-stroke rounded-lg text-[13px] sm:text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
      >
        <Download size={16} />
        <span className="hidden sm:inline">{t("reports.export")}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-card-bg border border-stroke rounded-xl shadow-lg py-1 min-w-[160px] animate-fade-in-down">
          <button
            onClick={() => { onExcel(); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-text-dark hover:bg-page-bg transition-colors"
          >
            <FileSpreadsheet size={16} className="text-green-600" />
            {t("reports.exportExcel")}
          </button>
          <button
            onClick={() => { onPdf(); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-text-dark hover:bg-page-bg transition-colors"
          >
            <FileText size={16} className="text-red-500" />
            {t("reports.exportPdf")}
          </button>
        </div>
      )}
    </div>
  );
}
