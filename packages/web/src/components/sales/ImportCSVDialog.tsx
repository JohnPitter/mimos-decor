import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import type { GatewayId } from "@mimos/shared";
import { useSaleStore } from "../../stores/sale.store.js";
import { useGatewayStore } from "../../stores/gateway.store.js";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ImportCSVDialog({ open, onClose, onImported }: Props) {
  const { t } = useTranslation();
  const { importCSV } = useSaleStore();
  const allGateways = useGatewayStore((s) => s.getAllGateways)();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [gateway, setGateway] = useState<GatewayId>("SHOPEE_CNPJ");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
    onClose();
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await importCSV(file, gateway);
      setResult(data);
      if (data.success > 0) {
        onImported();
      }
    } catch {
      setResult({ success: 0, errors: ["Erro ao importar arquivo"] });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-[18px] font-bold text-text-dark">{t("sales.importCSV")}</h2>
          <button
            onClick={handleClose}
            className="text-text-muted hover:text-text-dark transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleImport} className="p-6 space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              CSV <span className="text-red-400">*</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-4 border-2 border-dashed border-stroke rounded-xl text-[14px] text-text-secondary hover:border-primary hover:bg-rosa-light/30 transition-all"
            >
              {file ? (
                <>
                  <FileText size={20} className="text-primary" />
                  <span className="font-medium text-text-dark">{file.name}</span>
                  <span className="text-[12px] text-text-muted ml-auto">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-text-muted" />
                  <span>{t("common.search")}</span>
                </>
              )}
            </button>
          </div>

          {/* Gateway Select */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              Gateway <span className="text-red-400">*</span>
            </label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value as GatewayId)}
              required
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              {allGateways.map((gw) => (
                <option key={gw.id} value={gw.id}>
                  {gw.label}
                </option>
              ))}
            </select>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-3 pt-2">
              {result.success > 0 && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-[13px]">
                  <CheckCircle size={16} />
                  <span className="font-semibold">
                    {result.success} venda{result.success > 1 ? "s" : ""} importada{result.success > 1 ? "s" : ""} com sucesso
                  </span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-red-700 text-[13px] font-semibold mb-2">
                    <AlertCircle size={16} />
                    <span>{result.errors.length} erro{result.errors.length > 1 ? "s" : ""}</span>
                  </div>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i} className="text-[12px] text-red-600">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors"
            >
              {result ? t("common.close") : t("common.cancel")}
            </button>
            {!result && (
              <button
                type="submit"
                disabled={!file || loading}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t("common.loading") : t("sales.importCSV")}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
