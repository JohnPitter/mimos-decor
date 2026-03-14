import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Plug, ChevronDown, ChevronUp } from "lucide-react";
import { Header } from "../components/layout/Header.js";
import { ConfirmDialog } from "../components/common/ConfirmDialog.js";
import { useGatewayStore } from "../stores/gateway.store.js";
import { BUILT_IN_GATEWAYS, BUILT_IN_PARAMS } from "@mimos/shared";
import type { CustomGateway, CommissionTier, PixTier, GatewayParams } from "@mimos/shared";

interface TierRow { maxPrice: string; pct: string; fixed: string }
interface PixTierRow { maxPrice: string; pct: string }

interface FormData {
  slug: string;
  name: string;
  color: string;
  tiers: TierRow[];
  pixTiers: PixTierRow[];
  extraFixed: string;
}

const EMPTY_FORM: FormData = {
  slug: "",
  name: "",
  color: "#6B5E5E",
  tiers: [{ maxPrice: "", pct: "14", fixed: "0" }],
  pixTiers: [],
  extraFixed: "0",
};

function tiersToRows(tiers: CommissionTier[]): TierRow[] {
  return tiers.map((t) => ({
    maxPrice: t.maxPrice >= 999999999 || t.maxPrice === Infinity ? "" : String(t.maxPrice),
    pct: String(Math.round(t.pct * 10000) / 100),
    fixed: String(t.fixed),
  }));
}

function pixTiersToRows(tiers: PixTier[]): PixTierRow[] {
  return tiers.map((t) => ({
    maxPrice: t.maxPrice >= 999999999 || t.maxPrice === Infinity ? "" : String(t.maxPrice),
    pct: String(Math.round(t.pct * 10000) / 100),
  }));
}

function rowsToTiers(rows: TierRow[]): CommissionTier[] {
  return rows.map((r) => ({
    maxPrice: r.maxPrice === "" ? Infinity : Number(r.maxPrice),
    pct: Number(r.pct) / 100,
    fixed: Number(r.fixed),
  }));
}

function rowsToPixTiers(rows: PixTierRow[]): PixTier[] {
  return rows.map((r) => ({
    maxPrice: r.maxPrice === "" ? Infinity : Number(r.maxPrice),
    pct: Number(r.pct) / 100,
  }));
}

const PRESET_COLORS = [
  "#EE4D2D", "#FFE600", "#ff914d", "#3D2C2C",
  "#6B5E5E", "#4CAF50", "#2196F3", "#9C27B0",
  "#E91E63", "#00BCD4", "#FF5722", "#795548",
];

function formatPct(pct: number) {
  return `${(pct * 100).toFixed(1)}%`;
}

function formatPrice(price: number) {
  if (price >= 999999999 || price === Infinity) return "∞";
  return `R$ ${price.toFixed(2)}`;
}

function GatewayDetailPanel({ params, t }: { params: GatewayParams; t: (key: string) => string }) {
  return (
    <div className="mt-3 pt-3 border-t border-stroke/50 space-y-3 animate-fade-in">
      {/* Commission Tiers */}
      <div>
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">{t("gateways.commissionTiers")}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-text-muted">
                <th className="text-left py-1 pr-3 font-medium">{t("gateways.tierMaxPrice")}</th>
                <th className="text-right py-1 px-3 font-medium">{t("gateways.tierPct")}</th>
                <th className="text-right py-1 pl-3 font-medium">{t("gateways.tierFixed")}</th>
              </tr>
            </thead>
            <tbody>
              {params.tiers.map((tier, i) => (
                <tr key={i} className="text-text-dark">
                  <td className="py-1 pr-3 font-mono">{formatPrice(tier.maxPrice)}</td>
                  <td className="py-1 px-3 text-right font-semibold">{formatPct(tier.pct)}</td>
                  <td className="py-1 pl-3 text-right font-mono">R$ {tier.fixed.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pix Tiers */}
      {params.pixTiers.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">{t("gateways.pixTiers")}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-text-muted">
                  <th className="text-left py-1 pr-3 font-medium">{t("gateways.tierMaxPrice")}</th>
                  <th className="text-right py-1 pl-3 font-medium">{t("gateways.tierPct")}</th>
                </tr>
              </thead>
              <tbody>
                {params.pixTiers.map((tier, i) => (
                  <tr key={i} className="text-text-dark">
                    <td className="py-1 pr-3 font-mono">{formatPrice(tier.maxPrice)}</td>
                    <td className="py-1 pl-3 text-right font-semibold">{formatPct(tier.pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Extra Fixed */}
      {params.extraFixed > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("gateways.extraFixed")}</p>
          <p className="text-[13px] font-bold text-text-dark font-mono">R$ {params.extraFixed.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

export default function Gateways() {
  const { t } = useTranslation();
  const { customGateways, loading, fetchGateways, createGateway, updateGateway, deleteGateway, getAllGateways } = useGatewayStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<CustomGateway | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CustomGateway | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetchGateways(); }, [fetchGateways]);

  const allGateways = getAllGateways();

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingGateway(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (gw: CustomGateway) => {
    setForm({
      slug: gw.slug,
      name: gw.name,
      color: gw.color,
      tiers: tiersToRows(gw.tiers as CommissionTier[]),
      pixTiers: pixTiersToRows(gw.pixTiers as PixTier[]),
      extraFixed: String(gw.extraFixed),
    });
    setEditingGateway(gw);
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        color: form.color,
        tiers: rowsToTiers(form.tiers),
        pixTiers: rowsToPixTiers(form.pixTiers),
        extraFixed: Number(form.extraFixed),
      };

      if (editingGateway) {
        await updateGateway(editingGateway.id, payload);
      } else {
        await createGateway({ ...payload, slug: form.slug });
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGateway(deleteTarget.id);
      toast.success(t("gateways.deleteSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("gateways.deleteError"));
    } finally {
      setDeleteTarget(null);
    }
  };

  const updateTier = (index: number, field: keyof TierRow, value: string) => {
    setForm((prev) => {
      const tiers = [...prev.tiers];
      tiers[index] = { ...tiers[index], [field]: value };
      return { ...prev, tiers };
    });
  };

  const addTier = () => {
    setForm((prev) => ({
      ...prev,
      tiers: [...prev.tiers, { maxPrice: "", pct: "10", fixed: "0" }],
    }));
  };

  const removeTier = (index: number) => {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index),
    }));
  };

  const updatePixTier = (index: number, field: keyof PixTierRow, value: string) => {
    setForm((prev) => {
      const pixTiers = [...prev.pixTiers];
      pixTiers[index] = { ...pixTiers[index], [field]: value };
      return { ...prev, pixTiers };
    });
  };

  const addPixTier = () => {
    setForm((prev) => ({
      ...prev,
      pixTiers: [...prev.pixTiers, { maxPrice: "", pct: "0" }],
    }));
  };

  const removePixTier = (index: number) => {
    setForm((prev) => ({
      ...prev,
      pixTiers: prev.pixTiers.filter((_, i) => i !== index),
    }));
  };

  function getBuiltInParams(id: string): GatewayParams | null {
    return BUILT_IN_PARAMS[id] ?? null;
  }

  function getCustomParams(gw: CustomGateway): GatewayParams {
    return {
      tiers: (gw.tiers as CommissionTier[]).map((t) => ({
        ...t,
        maxPrice: t.maxPrice >= 999999999 ? Infinity : t.maxPrice,
      })),
      pixTiers: gw.pixTiers as PixTier[],
      extraFixed: gw.extraFixed,
    };
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title={t("gateways.title")} />

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[13px] text-text-muted">
            {allGateways.length} gateways ({BUILT_IN_GATEWAYS.length} {t("gateways.builtIn")} + {customGateways.length} {t("gateways.custom")})
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
          >
            <Plus size={16} />
            {t("gateways.newGateway")}
          </button>
        </div>

        {loading && customGateways.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-card-bg rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Built-in gateways */}
            <div>
              <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                {t("gateways.builtIn")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allGateways.filter((g) => !g.isCustom).map((gw, index) => {
                  const params = getBuiltInParams(gw.id);
                  const isExpanded = expandedIds.has(gw.id);
                  return (
                    <div
                      key={gw.id}
                      className="bg-card-bg border border-stroke rounded-xl p-4 animate-fade-in-up"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: gw.color + "20" }}
                        >
                          <Plug size={18} style={{ color: gw.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-text-dark">{gw.label}</p>
                          <p className="text-[11px] text-text-muted font-mono">{gw.id}</p>
                        </div>
                        <span className="text-[11px] px-2 py-1 bg-page-bg rounded-full text-text-muted font-medium">
                          {t("gateways.default")}
                        </span>
                        <button
                          onClick={() => toggleExpand(gw.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-dark hover:bg-page-bg transition-all"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {isExpanded && params && <GatewayDetailPanel params={params} t={t} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom gateways */}
            {customGateways.length > 0 && (
              <div className="mt-6">
                <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  {t("gateways.custom")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customGateways.map((gw, index) => {
                    const params = getCustomParams(gw);
                    const isExpanded = expandedIds.has(gw.slug);
                    return (
                      <div
                        key={gw.id}
                        className="bg-card-bg border border-stroke rounded-xl p-4 hover:shadow-sm transition-all animate-fade-in-up"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: gw.color + "20" }}
                          >
                            <Plug size={18} style={{ color: gw.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-text-dark">{gw.name}</p>
                            <p className="text-[11px] text-text-muted font-mono">{gw.slug}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleExpand(gw.slug)}
                              className="p-2 rounded-lg text-text-muted hover:text-text-dark hover:bg-page-bg transition-all"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button
                              onClick={() => openEdit(gw)}
                              className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(gw)}
                              className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        {isExpanded && <GatewayDetailPanel params={params} t={t} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {customGateways.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted mt-6">
                <Plug size={48} className="mb-4 opacity-40" />
                <p className="text-[15px] font-medium">{t("gateways.emptyCustom")}</p>
                <p className="text-[13px] mt-1">{t("gateways.emptyCustomHint")}</p>
              </div>
            )}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("nav.deleteConfirmTitle")}
        message={t("gateways.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in mx-4 sm:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stroke">
              <h2 className="text-[18px] font-bold text-text-dark">
                {editingGateway ? t("gateways.editGateway") : t("gateways.newGateway")}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-dark transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              {!editingGateway && (
                <div>
                  <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                    Slug <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })}
                    required
                    placeholder="EX: SHOPEE_NOVO"
                    className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                  <p className="text-[11px] text-text-muted mt-1">{t("gateways.slugHint")}</p>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  {t("gateways.nameLabel")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ex: Shopee Full"
                  className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-2 uppercase tracking-wider">
                  {t("gateways.commissionTiers")} <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_80px_80px_32px] gap-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider px-1">
                    <span>{t("gateways.tierMaxPrice")}</span>
                    <span>{t("gateways.tierPct")}</span>
                    <span>{t("gateways.tierFixed")}</span>
                    <span />
                  </div>
                  {form.tiers.map((tier, i) => (
                    <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2">
                      <input type="text" value={tier.maxPrice} onChange={(e) => updateTier(i, "maxPrice", e.target.value)} placeholder="∞" className="px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                      <input type="text" value={tier.pct} onChange={(e) => updateTier(i, "pct", e.target.value)} className="px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                      <input type="text" value={tier.fixed} onChange={(e) => updateTier(i, "fixed", e.target.value)} className="px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                      <button type="button" onClick={() => removeTier(i)} disabled={form.tiers.length <= 1} className="p-1.5 text-text-muted hover:text-red-500 transition-colors disabled:opacity-30"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addTier} className="mt-2 flex items-center gap-1 text-[12px] font-medium text-primary hover:text-primary-hover transition-colors">
                  <Plus size={12} /> {t("gateways.addTier")}
                </button>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-2 uppercase tracking-wider">
                  {t("gateways.pixTiers")}
                </label>
                {form.pixTiers.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_80px_32px] gap-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider px-1">
                      <span>{t("gateways.tierMaxPrice")}</span>
                      <span>{t("gateways.tierPct")}</span>
                      <span />
                    </div>
                    {form.pixTiers.map((tier, i) => (
                      <div key={i} className="grid grid-cols-[1fr_80px_32px] gap-2">
                        <input type="text" value={tier.maxPrice} onChange={(e) => updatePixTier(i, "maxPrice", e.target.value)} placeholder="∞" className="px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                        <input type="text" value={tier.pct} onChange={(e) => updatePixTier(i, "pct", e.target.value)} className="px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-page-bg text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                        <button type="button" onClick={() => removePixTier(i)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-text-muted italic">{t("gateways.noPixTiers")}</p>
                )}
                <button type="button" onClick={addPixTier} className="mt-2 flex items-center gap-1 text-[12px] font-medium text-primary hover:text-primary-hover transition-colors">
                  <Plus size={12} /> {t("gateways.addPixTier")}
                </button>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">{t("gateways.extraFixed")}</label>
                <input type="number" step="0.01" value={form.extraFixed} onChange={(e) => setForm({ ...form, extraFixed: e.target.value })} className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                <p className="text-[11px] text-text-muted mt-1">{t("gateways.extraFixedHint")}</p>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">{t("gateways.colorLabel")}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${form.color === c ? "ring-2 ring-primary ring-offset-2" : "border border-stroke"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-10 border border-stroke rounded-lg cursor-pointer" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-muted hover:bg-page-bg transition-colors">
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
                  {submitting ? t("common.loading") : editingGateway ? t("common.save") : t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
