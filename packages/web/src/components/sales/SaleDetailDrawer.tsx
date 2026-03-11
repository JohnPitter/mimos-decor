import { useEffect, useState } from "react";
import { X, ChevronDown, Clock, ArrowRight } from "lucide-react";
import {
  formatBRL,
  GATEWAY_LABELS,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
} from "@mimos/shared";
import type { Sale, DeliveryStatus, DeliveryStatusHistoryEntry } from "@mimos/shared";
import { useSaleStore } from "../../stores/sale.store.js";

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
  "SHIPPED",
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
  const { updateSaleStatus, getSaleDetail } = useSaleStore();
  const [statusHistory, setStatusHistory] = useState<DeliveryStatusHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (sale && open) {
      setLoadingHistory(true);
      setShowStatusDropdown(false);
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-screen w-[480px] z-50 bg-card-bg border-l border-stroke shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stroke sticky top-0 bg-card-bg z-10">
          <h2 className="text-[18px] font-bold text-text-dark">Detalhes da Venda</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-dark transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-page-bg rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                  Produto
                </p>
                <p className="text-[16px] font-bold text-text-dark">{sale.productName}</p>
              </div>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(sale.deliveryStatus)}`}
              >
                {DELIVERY_STATUS_LABELS[sale.deliveryStatus]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  Quantidade
                </p>
                <p className="text-[15px] font-bold text-text-dark">{sale.quantity}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  Gateway
                </p>
                <p className="text-[15px] font-bold text-text-dark">
                  {GATEWAY_LABELS[sale.gateway]}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  Valor de Venda
                </p>
                <p className="text-[15px] font-bold text-text-dark">
                  {formatBRL(sale.salePrice)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  Lucro
                </p>
                <p
                  className={`text-[15px] font-bold ${sale.profit >= 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {formatBRL(sale.profit)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stroke/50">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  Custo Unitário
                </p>
                <p className="text-[13px] font-medium text-text-secondary">
                  {formatBRL(sale.unitCost)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  Taxas Totais
                </p>
                <p className="text-[13px] font-medium text-text-secondary">
                  {formatBRL(sale.totalFees)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  Receita Líquida
                </p>
                <p className="text-[13px] font-medium text-text-secondary">
                  {formatBRL(sale.netRevenue)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                  Data
                </p>
                <p className="text-[13px] font-medium text-text-secondary">
                  {new Date(sale.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            {(sale.customerName || sale.customerDocument) && (
              <div className="pt-2 border-t border-stroke/50">
                {sale.customerName && (
                  <div className="mb-2">
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                      Cliente
                    </p>
                    <p className="text-[13px] font-medium text-text-dark">
                      {sale.customerName}
                    </p>
                  </div>
                )}
                {sale.customerDocument && (
                  <div>
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
                      CPF/CNPJ
                    </p>
                    <p className="text-[13px] font-medium text-text-dark">
                      {sale.customerDocument}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Update */}
          <div>
            <p className="text-[12px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Atualizar Status
            </p>
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={updatingStatus}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-dark bg-card-bg hover:bg-page-bg transition-colors disabled:opacity-50"
              >
                <span>{DELIVERY_STATUS_LABELS[sale.deliveryStatus]}</span>
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
                      {DELIVERY_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Delivery Timeline */}
          <div>
            <p className="text-[12px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">
              Histórico de Status
            </p>
            {loadingHistory ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-page-bg rounded-lg animate-pulse" />
                ))}
              </div>
            ) : statusHistory.length === 0 ? (
              <p className="text-[13px] text-text-muted text-center py-6">
                Nenhuma alteração de status registrada
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
                            {DELIVERY_STATUS_LABELS[entry.fromStatus]}
                          </span>
                          <ArrowRight size={12} className="text-text-muted" />
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(entry.toStatus)}`}
                          >
                            {DELIVERY_STATUS_LABELS[entry.toStatus]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-text-muted">
                          <Clock size={11} />
                          <span>
                            {new Date(entry.changedAt).toLocaleString("pt-BR")}
                          </span>
                          <span className="text-text-secondary font-medium">
                            por {entry.changedByName}
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
