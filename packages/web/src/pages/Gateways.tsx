import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, X, Plug } from "lucide-react";
import { Header } from "../components/layout/Header.js";
import { useGatewayStore } from "../stores/gateway.store.js";
import { BUILT_IN_GATEWAYS, GATEWAY_LABELS } from "@mimos/shared";
import type { CustomGateway, BuiltInGatewayId } from "@mimos/shared";

interface FormData {
  slug: string;
  name: string;
  color: string;
  baseGateway: BuiltInGatewayId;
}

const EMPTY_FORM: FormData = { slug: "", name: "", color: "#6B5E5E", baseGateway: "SHOPEE_CNPJ" };

const PRESET_COLORS = [
  "#EE4D2D", "#FFE600", "#ff914d", "#3D2C2C",
  "#6B5E5E", "#4CAF50", "#2196F3", "#9C27B0",
  "#E91E63", "#00BCD4", "#FF5722", "#795548",
];

export default function Gateways() {
  const { t } = useTranslation();
  const { customGateways, loading, fetchGateways, createGateway, updateGateway, deleteGateway, getAllGateways } = useGatewayStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<CustomGateway | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchGateways(); }, [fetchGateways]);

  const allGateways = getAllGateways();

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
      baseGateway: gw.baseGateway as BuiltInGatewayId,
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
      if (editingGateway) {
        await updateGateway(editingGateway.id, {
          name: form.name,
          color: form.color,
          baseGateway: form.baseGateway,
        });
      } else {
        await createGateway(form);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (gw: CustomGateway) => {
    if (!confirm(t("gateways.deleteConfirm"))) return;
    try {
      await deleteGateway(gw.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title={t("gateways.title")} />

      <main className="flex-1 p-6 overflow-y-auto animate-fade-in">
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
                {allGateways.filter((g) => !g.isCustom).map((gw, index) => (
                  <div
                    key={gw.id}
                    className="bg-card-bg border border-stroke rounded-xl p-4 flex items-center gap-4 animate-fade-in-up"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
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
                  </div>
                ))}
              </div>
            </div>

            {/* Custom gateways */}
            {customGateways.length > 0 && (
              <div className="mt-6">
                <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  {t("gateways.custom")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customGateways.map((gw, index) => (
                    <div
                      key={gw.id}
                      className="bg-card-bg border border-stroke rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-all animate-fade-in-up"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: gw.color + "20" }}
                      >
                        <Plug size={18} style={{ color: gw.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-text-dark">{gw.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-text-muted font-mono">{gw.slug}</p>
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
                            {t("gateways.basedOn")} {GATEWAY_LABELS[gw.baseGateway] ?? gw.baseGateway}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(gw)}
                          className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(gw)}
                          className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
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
                <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  {t("gateways.baseGatewayLabel")} <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.baseGateway}
                  onChange={(e) => setForm({ ...form, baseGateway: e.target.value as BuiltInGatewayId })}
                  className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                >
                  {BUILT_IN_GATEWAYS.map((gid) => (
                    <option key={gid} value={gid}>{GATEWAY_LABELS[gid] ?? gid}</option>
                  ))}
                </select>
                <p className="text-[11px] text-text-muted mt-1">{t("gateways.baseGatewayHint")}</p>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  {t("gateways.colorLabel")}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${form.color === c ? "ring-2 ring-primary ring-offset-2" : "border border-stroke"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full h-10 border border-stroke rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-muted hover:bg-page-bg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                >
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
