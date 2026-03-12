import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Package, ChevronDown } from "lucide-react";
import type { Product } from "@mimos/shared";

interface Props {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  disabledIds: Set<string>;
}

export function ProductPicker({ products, value, onChange, disabledIds }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = products.find((p) => p.id === value);

  const filtered = products.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.supplier?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg hover:bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-left"
      >
        {selected ? (
          <>
            <div className="w-7 h-7 rounded-md bg-page-bg border border-stroke/50 flex items-center justify-center overflow-hidden shrink-0">
              {selected.imageUrl ? (
                <img src={selected.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Package size={14} className="text-text-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-text-dark truncate">{selected.name}</p>
            </div>
            <span className="text-[11px] text-text-muted shrink-0">est: {selected.quantity}</span>
          </>
        ) : (
          <span className="text-text-muted flex-1">{t("sales.selectProduct")}</span>
        )}
        <ChevronDown size={14} className={`text-text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-card-bg border border-stroke rounded-xl shadow-lg overflow-hidden animate-fade-in-down">
          <div className="p-2 border-b border-stroke/50">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("products.searchPlaceholder")}
                className="w-full pl-8 pr-3 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-[13px] text-text-muted">{t("common.noResults")}</div>
            ) : (
              filtered.map((p) => {
                const isDisabled = disabledIds.has(p.id) && p.id !== value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => { onChange(p.id); setOpen(false); setSearch(""); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      p.id === value ? "bg-primary/10" : isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-page-bg"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-page-bg border border-stroke/50 flex items-center justify-center overflow-hidden shrink-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={14} className="text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-text-dark truncate">{p.name}</p>
                      {p.supplier && <p className="text-[11px] text-text-muted truncate">{p.supplier}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[12px] font-semibold ${p.quantity <= 5 ? "text-red-500" : "text-text-dark"}`}>
                        {p.quantity} {t("dashboard.units")}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
