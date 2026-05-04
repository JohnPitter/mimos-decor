import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Header } from "../components/layout/Header.js";
import { ConfirmDialog } from "../components/common/ConfirmDialog.js";
import { getTodayISO } from "../lib/timezone.js";
import { useSupplyStore } from "../stores/supply.store.js";
import { formatBRL } from "@mimos/shared";
import type { Supply } from "@mimos/shared";
import { Plus, Search, Pencil, Trash2, X, PackageOpen, AlertTriangle, ShoppingCart } from "lucide-react";
import { MaskedInput } from "../components/common/MaskedInput.js";

const UNITS = ["un", "kg", "g", "L", "mL", "m", "cm", "pct", "cx", "rolo"];

function SupplyFormDialog({ open, supply, onClose, onSubmit }: {
  open: boolean;
  supply?: Supply | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("un");
  const [supplier, setSupplier] = useState("");
  const [minStock, setMinStock] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (supply) {
      setName(supply.name);
      setDescription(supply.description ?? "");
      setUnitPrice(String(supply.unitPrice));
      setQuantity(String(supply.quantity));
      setUnit(supply.unit);
      setSupplier(supply.supplier ?? "");
      setMinStock(String(supply.minStock));
    } else {
      setName("");
      setDescription("");
      setUnitPrice("");
      setQuantity("0");
      setUnit("un");
      setSupplier("");
      setMinStock("0");
    }
  }, [supply, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        description: description || undefined,
        unitPrice: Number(unitPrice),
        quantity: Number(quantity),
        unit,
        supplier: supplier || undefined,
        minStock: Number(minStock),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in mx-4 sm:mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-[18px] font-bold text-text-dark">
            {supply ? t("supplies.editSupply") : t("supplies.newSupply")}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("supplies.name")} <span className="text-red-400">*</span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("supplies.description")}
            </label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("supplies.unitPrice")} <span className="text-red-400">*</span>
              </label>
              <MaskedInput mask="currency" value={unitPrice} onChange={setUnitPrice} required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("supplies.quantity")}
              </label>
              <MaskedInput mask="integer" value={quantity} onChange={setQuantity}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("supplies.unit")}
              </label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("supplies.minStock")}
              </label>
              <MaskedInput mask="integer" value={minStock} onChange={setMinStock}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("supplies.supplier")}
            </label>
            <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
              {submitting ? t("common.loading") : supply ? t("common.save") : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PurchaseFormDialog({ open, supply, onClose, onSubmit }: {
  open: boolean;
  supply: Supply | null;
  onClose: () => void;
  onSubmit: (data: { quantity: number; totalCost: number; supplier?: string; note?: string; dueDate: string }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && supply) {
      setQuantity("");
      setTotalCost("");
      setSupplier(supply.supplier ?? "");
      setDueDate(getTodayISO());
      setNote("");
    }
  }, [open, supply]);

  if (!open || !supply) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        quantity: Number(quantity),
        totalCost: Number(totalCost),
        supplier: supplier || undefined,
        note: note || undefined,
        dueDate,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in mx-4 sm:mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <div>
            <h2 className="text-[18px] font-bold text-text-dark">{t("supplies.registerPurchase")}</h2>
            <p className="text-[13px] text-text-muted mt-0.5">{supply.name}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("supplies.purchaseQuantity")} <span className="text-red-400">*</span>
              </label>
              <MaskedInput mask="integer" value={quantity} onChange={setQuantity} required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("supplies.purchaseTotalCost")} <span className="text-red-400">*</span>
              </label>
              <MaskedInput mask="currency" value={totalCost} onChange={setTotalCost} required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("supplies.supplier")}
            </label>
            <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("supplies.purchaseDueDate")} <span className="text-red-400">*</span>
            </label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("supplies.purchaseNote")}
            </label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
              {submitting ? t("common.loading") : t("supplies.registerPurchase")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Supplies() {
  const { t } = useTranslation();
  const { supplies, total, loading, fetchSupplies, createSupply, updateSupply, deleteSupply, registerPurchase } = useSupplyStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupply, setEditSupply] = useState<Supply | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [purchaseSupply, setPurchaseSupply] = useState<Supply | null>(null);
  const [supplyIdempotencyKey, setSupplyIdempotencyKey] = useState(() => crypto.randomUUID());
  const [purchaseIdempotencyKey, setPurchaseIdempotencyKey] = useState(() => crypto.randomUUID());

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const loadSupplies = useCallback(() => {
    fetchSupplies({ search: search || undefined, page });
  }, [fetchSupplies, search, page]);

  useEffect(() => { loadSupplies(); }, [loadSupplies]);
  useEffect(() => { setPage(1); }, [search]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (editSupply) {
      await updateSupply(editSupply.id, data);
    } else {
      await createSupply(data, supplyIdempotencyKey);
      setSupplyIdempotencyKey(crypto.randomUUID());
    }
    setEditSupply(null);
    loadSupplies();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteSupply(deleteId);
      toast.success(t("supplies.deleteSuccess"));
      loadSupplies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("supplies.deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  const handlePurchase = async (data: { quantity: number; totalCost: number; supplier?: string; note?: string; dueDate: string }) => {
    if (!purchaseSupply) return;
    try {
      await registerPurchase(purchaseSupply.id, data, purchaseIdempotencyKey);
      setPurchaseIdempotencyKey(crypto.randomUUID());
      toast.success(t("supplies.purchaseSuccess"));
      loadSupplies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("supplies.purchaseError"));
    }
  };

  return (
    <div>
      <Header title={t("supplies.title")} />
      <div className="p-4 sm:p-6 animate-fade-in">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6 animate-fade-in-down">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("supplies.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 border border-stroke rounded-lg text-[14px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all sm:max-w-sm"
            />
          </div>
          <button
            onClick={() => { setEditSupply(null); setDialogOpen(true); }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} /> {t("supplies.newSupply")}
          </button>
        </div>

        {!loading && (
          <div className="mb-3 text-[13px] text-text-muted">
            {total} {t("supplies.totalRegistered")}
          </div>
        )}

        {/* Table */}
        <div className="bg-card-bg border border-stroke rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke bg-page-bg">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("supplies.name")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("supplies.quantity")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("supplies.unit")}</th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("supplies.unitPrice")}</th>
                  <th className="text-left px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("supplies.supplier")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("supplies.minStock")}</th>
                  <th className="px-3 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-stroke/50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-page-bg rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : supplies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <PackageOpen size={48} className="mx-auto text-text-muted/40 mb-3" />
                      <p className="text-text-muted text-[14px]">{t("common.noResults")}</p>
                    </td>
                  </tr>
                ) : (
                  supplies.map((supply, index) => (
                    <tr key={supply.id} className="border-b border-stroke/50 hover:bg-rosa-light/30 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-lg bg-page-bg border border-stroke flex items-center justify-center">
                              <PackageOpen size={16} className="text-text-muted" />
                            </div>
                            {supply.quantity <= supply.minStock && (
                              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white" title={t("supplies.lowStock")}>
                                <AlertTriangle size={10} className="text-yellow-900" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-text-dark">{supply.name}</p>
                            {supply.description && <p className="text-[11px] text-text-muted">{supply.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className={`text-[13px] font-semibold ${supply.quantity <= supply.minStock ? "text-red-500" : "text-text-dark"}`}>
                          {supply.quantity}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3 text-[13px] text-text-muted">{supply.unit}</td>
                      <td className="text-right px-3 py-3 text-[13px] font-medium text-text-dark">{formatBRL(supply.unitPrice)}</td>
                      <td className="px-3 py-3 text-[13px] text-text-secondary">{supply.supplier ?? "—"}</td>
                      <td className="text-center px-3 py-3 text-[13px] text-text-muted">{supply.minStock}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setPurchaseSupply(supply)} className="p-1.5 rounded-lg text-text-muted hover:text-emerald-600 hover:bg-emerald-50 transition-all" title={t("supplies.registerPurchase")}>
                            <ShoppingCart size={15} />
                          </button>
                          <button onClick={() => { setEditSupply(supply); setDialogOpen(true); }} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-rosa-light transition-all">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteId(supply.id)} className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs rounded-lg border border-stroke hover:bg-neutral-bg2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {t("common.previous")}
            </button>
            <span className="text-xs text-text-muted">{page} {t("common.of")} {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs rounded-lg border border-stroke hover:bg-neutral-bg2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {t("common.next")}
            </button>
          </div>
        )}
      </div>

      <SupplyFormDialog open={dialogOpen} supply={editSupply} onClose={() => { setDialogOpen(false); setEditSupply(null); }} onSubmit={handleSubmit} />
      <PurchaseFormDialog open={!!purchaseSupply} supply={purchaseSupply} onClose={() => setPurchaseSupply(null)} onSubmit={handlePurchase} />
      <ConfirmDialog
        open={!!deleteId}
        title={t("nav.deleteConfirmTitle")}
        message={t("supplies.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
