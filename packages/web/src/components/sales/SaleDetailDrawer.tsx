import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { X, ChevronDown, Clock, ArrowRight, Pencil } from "lucide-react";
import {
  formatBRL,
  DELIVERY_STATUS_COLORS,
} from "@mimos/shared";
import type { Sale, DeliveryStatus, DeliveryStatusHistoryEntry } from "@mimos/shared";
import { useSaleStore } from "../../stores/sale.store.js";
import { useGatewayStore } from "../../stores/gateway.store.js";
import { useSettingsStore } from "../../stores/settings.store.js";

interface Props {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  green: "bg-green-100 text-green-800 border-green-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

const TIMELINE_DOT_MAP: Record<string, string> = {
  yellow: "bg-yellow-400",
  blue: "bg-blue-400",
  indigo: "bg-indigo-400",
  purple: "bg-purple-400",
  green: "bg-green-400",
  orange: "bg-orange-400",
  red: "bg-red-400",
};

const ALL_STATUSES: DeliveryStatus[] = [
  "PENDING",
  "PREPARING",
  "IN_TRANSIT",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
];

function getStatusBadgeClass(status: DeliveryStatus): string {
  const color = DELIVERY_STATUS_COLORS[status];
  return STATUS_COLOR_MAP[color] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

function getTimelineDotClass(status: DeliveryStatus): string {
  const color = DELIVERY_STATUS_COLORS[status];
  return TIMELINE_DOT_MAP[color] ?? "bg-gray-400";
}

export function SaleDetailDrawer({ sale, open, onClose, onStatusUpdated }: Props) {
  const { t } = useTranslation();
  const { updateSaleStatus, updateSale, getSaleDetail } = useSaleStore();
  const getGatewayLabel = useGatewayStore((s) => s.getGatewayLabel);
  const allowSaleEditing = useSettingsStore((s) => s.appSettings.allowSaleEditing);
  const [statusHistory, setStatusHistory] = useState<DeliveryStatusHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sale && open) {
      setLoadingHistory(true);
      setShowStatusDropdown(false);
      setEditing(false);
      getSaleDetail(sale.id)
        .then((detail) => setStatusHistory(detail.statusHistory ?? []))
        .catch(() => setStatusHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [sale, open, getSaleDetail]);

  if (!open || !sale) return null;

  const handleStatusUpdate = async (newStatus: DeliveryStatus) => {
    setUpdatingStatus(true);
    try {
      await updateSaleStatus(sale.id, newStatus);
      setShowStatusDropdown(false);
      onStatusUpdated();
      const detail = await getSaleDetail(sale.id);
      setStatusHistory(detail.statusHistory ?? []);
    } catch {
      // Error handled silently
    } finally {
      setUpdatingStatus(false);
    }
  };

  const availableStatuses = ALL_STATUSES.filter((s) => s !== sale.deliveryStatus);

  const startEditing = () => {
    setEditForm({
      customerName: sale.customerName ?? "",
      customerDocument: sale.customerDocument ?? "",
      customerState: sale.customerState ?? "",
      customerGender: sale.customerGender ?? "",
      shopeeUsername: sale.shopeeUsername ?? "",
      trackingCode: sale.trackingCode ?? "",
      salePrice: String(sale.salePrice),
      totalFees: String(sale.totalFees),
      discount: String(sale.discount),
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await updateSale(sale.id, {
        customerName: editForm.customerName || undefined,
        customerDocument: editForm.customerDocument || undefined,
        customerState: editForm.customerState || undefined,
        customerGender: editForm.customerGender || undefined,
        shopeeUsername: editForm.shopeeUsername || undefined,
        trackingCode: editForm.trackingCode || undefined,
        salePrice: Number(editForm.salePrice),
        totalFees: Number(editForm.totalFees),
        discount: Number(editForm.discount),
        netRevenue: Number(editForm.salePrice) - Number(editForm.totalFees) - Number(editForm.discount),
        profit: Number(editForm.salePrice) - Number(editForm.totalFees) - Number(editForm.discount) - sale.totalCost,
      });
      toast.success(t("sales.editSuccess"));
      setEditing(false);
      onStatusUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sales.editError"));
    } finally {
      setSaving(false);
    }
  };

  const ef = (key: string) => editForm[key] ?? "";
  const setEf = (key: string, value: string) => setEditForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-screen w-full sm:w-[480px] z-50 bg-card-bg border-l border-stroke shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stroke sticky top-0 bg-card-bg z-10">
          <h2 className="text-[18px] font-bold text-text-dark">{t("sales.saleDetails")}</h2>
          <div className="flex items-center gap-2">
            {allowSaleEditing && !editing && (
              <button
                onClick={startEditing}
                className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                title={t("common.edit")}
              >
                <Pencil size={18} />
              </button>
            )}
            <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header info */}
          <div className="bg-page-bg rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                  {t("sales.gateway")}
                </p>
                <p className="text-[16px] font-bold text-text-dark">
                  {getGatewayLabel(sale.gateway)}
                </p>
              </div>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(sale.deliveryStatus)}`}
              >
                {t(`deliveryStatus.${sale.deliveryStatus}`)}
              </span>
            </div>

            {/* Items list */}
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                {t("sales.items")} ({sale.items.length})
              </p>
              <div className="space-y-2">
                {sale.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-card-bg rounded-lg p-3 border border-stroke/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-text-dark truncate">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {item.quantity}x {formatBRL(item.salePrice)}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-[13px] font-bold text-text-dark">
                        {formatBRL(item.salePrice * item.quantity)}
                      </p>
                      <p
                        className={`text-[11px] font-semibold ${item.profit >= 0 ? "text-green-600" : "text-red-500"}`}
                      >
                        {formatBRL(item.profit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stroke/50">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  {t("sales.salePrice")}
                </p>
                <p className="text-[15px] font-bold text-text-dark">
                  {formatBRL(sale.salePrice)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  {t("sales.profit")}
                </p>
                <p
                  className={`text-[15px] font-bold ${sale.profit >= 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {formatBRL(sale.profit)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  {t("sales.totalFees")}
                </p>
                <p className="text-[13px] font-medium text-text-secondary">
                  {formatBRL(sale.totalFees)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  {t("sales.netRevenue")}
                </p>
                <p className="text-[13px] font-medium text-text-secondary">
                  {formatBRL(sale.netRevenue)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  {t("sales.totalCost")}
                </p>
                <p className="text-[13px] font-medium text-text-secondary">
                  {formatBRL(sale.totalCost)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  {t("sales.date")}
                </p>
                <p className="text-[13px] font-medium text-text-secondary">
                  {new Date(sale.saleDate ?? sale.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            </div>

            {/* Customer & sale info */}
            <div className="pt-2 border-t border-stroke/50 grid grid-cols-2 gap-3">
              {sale.shopeeUsername && (
                <div>
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">{t("sales.shopeeUsername")}</p>
                  <p className="text-[13px] font-medium text-text-dark">{sale.shopeeUsername}</p>
                </div>
              )}
              {sale.customerGender && (
                <div>
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">{t("sales.customerGender")}</p>
                  <p className="text-[13px] font-medium text-text-dark">
                    {sale.customerGender === "M" ? t("sales.genderMale") : sale.customerGender === "F" ? t("sales.genderFemale") : t("sales.genderOther")}
                  </p>
                </div>
              )}
              {sale.customerState && (
                <div>
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">{t("sales.customerState")}</p>
                  <p className="text-[13px] font-medium text-text-dark">{sale.customerState}</p>
                </div>
              )}
              {sale.customerName && (
                <div>
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">{t("sales.customer")}</p>
                  <p className="text-[13px] font-medium text-text-dark">{sale.customerName}</p>
                </div>
              )}
              {sale.customerDocument && (
                <div>
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">{t("sales.customerDocument")}</p>
                  <p className="text-[13px] font-medium text-text-dark">{sale.customerDocument}</p>
                </div>
              )}
              {sale.discount > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">{t("sales.discount")}</p>
                  <p className="text-[13px] font-medium text-red-500">-{formatBRL(sale.discount)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="bg-page-bg rounded-xl p-5 space-y-3 animate-fade-in">
              <h3 className="text-[14px] font-bold text-text-dark mb-2">{t("common.edit")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sales.customerName")}</label>
                  <input type="text" value={ef("customerName")} onChange={(e) => setEf("customerName", e.target.value)} className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sales.customerDocument")}</label>
                  <input type="text" value={ef("customerDocument")} onChange={(e) => setEf("customerDocument", e.target.value)} className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sales.shopeeUsername")}</label>
                  <input type="text" value={ef("shopeeUsername")} onChange={(e) => setEf("shopeeUsername", e.target.value)} className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sales.customerGender")}</label>
                  <select value={ef("customerGender")} onChange={(e) => setEf("customerGender", e.target.value)} className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                    <option value="">{t("common.select")}</option>
                    <option value="M">{t("sales.genderMale")}</option>
                    <option value="F">{t("sales.genderFemale")}</option>
                    <option value="O">{t("sales.genderOther")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sales.customerState")}</label>
                  <input type="text" value={ef("customerState")} onChange={(e) => setEf("customerState", e.target.value)} maxLength={2} className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sales.trackingCode")}</label>
                  <input type="text" value={ef("trackingCode")} onChange={(e) => setEf("trackingCode", e.target.value)} className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sales.salePrice")}</label>
                  <input type="number" step="0.01" value={ef("salePrice")} onChange={(e) => setEf("salePrice", e.target.value)} className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sales.totalFees")}</label>
                  <input type="number" step="0.01" value={ef("totalFees")} onChange={(e) => setEf("totalFees", e.target.value)} className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sales.discount")}</label>
                  <input type="number" step="0.01" value={ef("discount")} onChange={(e) => setEf("discount", e.target.value)} className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditing(false)} className="flex-1 py-2 border border-stroke rounded-lg text-[13px] font-medium text-text-secondary hover:bg-card-bg transition-colors">
                  {t("common.cancel")}
                </button>
                <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-[13px] font-bold transition-all disabled:opacity-60">
                  {saving ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </div>
          )}

          {/* Status Update */}
          {allowSaleEditing && <div>
            <p className="text-[12px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              {t("sales.updateStatus")}
            </p>
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={updatingStatus}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-dark bg-card-bg hover:bg-page-bg transition-colors disabled:opacity-50"
              >
                <span>{t(`deliveryStatus.${sale.deliveryStatus}`)}</span>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card-bg border border-stroke rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {availableStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-page-bg transition-colors flex items-center gap-2"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${getTimelineDotClass(status)}`}
                      />
                      {t(`deliveryStatus.${status}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>}

          {/* Delivery Timeline */}
          <div>
            <p className="text-[12px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">
              {t("sales.statusHistory")}
            </p>
            {loadingHistory ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-page-bg rounded-lg animate-pulse" />
                ))}
              </div>
            ) : statusHistory.length === 0 ? (
              <p className="text-[13px] text-text-muted text-center py-6">
                {t("sales.noStatusHistory")}
              </p>
            ) : (
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-stroke" />

                <div className="space-y-4">
                  {statusHistory.map((entry) => (
                    <div key={entry.id} className="relative">
                      {/* Dot */}
                      <div
                        className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-card-bg ${getTimelineDotClass(entry.toStatus)}`}
                      />
                      <div className="bg-page-bg rounded-lg p-3">
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-text-dark">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(entry.fromStatus)}`}
                          >
                            {t(`deliveryStatus.${entry.fromStatus}`)}
                          </span>
                          <ArrowRight size={12} className="text-text-muted" />
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(entry.toStatus)}`}
                          >
                            {t(`deliveryStatus.${entry.toStatus}`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-text-muted">
                          <Clock size={11} />
                          <span>
                            {new Date(entry.changedAt).toLocaleString()}
                          </span>
                          <span className="text-text-secondary font-medium">
                            {t("sales.by")} {entry.changedByName}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
