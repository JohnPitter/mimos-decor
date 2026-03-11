import { useEffect, useState, useCallback } from "react";
import { Header } from "../components/layout/Header.js";
import { SaleFormDialog } from "../components/sales/SaleFormDialog.js";
import { SaleDetailDrawer } from "../components/sales/SaleDetailDrawer.js";
import { ImportCSVDialog } from "../components/sales/ImportCSVDialog.js";
import { useSaleStore } from "../stores/sale.store.js";
import {
  formatBRL,
  GATEWAY_LABELS,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
} from "@mimos/shared";
import type { Sale, DeliveryStatus } from "@mimos/shared";
import { Plus, Upload, ShoppingCart } from "lucide-react";

interface StatusTab {
  label: string;
  status: DeliveryStatus | null;
}

const TABS: StatusTab[] = [
  { label: "Todas", status: null },
  { label: "Pendentes", status: "PENDING" },
  { label: "Preparando", status: "PREPARING" },
  { label: "Em Trânsito", status: "IN_TRANSIT" },
  { label: "Entregues", status: "DELIVERED" },
];

const STATUS_BADGE_MAP: Record<string, string> = {
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  green: "bg-green-100 text-green-800 border-green-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

function getStatusBadgeClass(status: DeliveryStatus): string {
  const color = DELIVERY_STATUS_COLORS[status];
  return STATUS_BADGE_MAP[color] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export default function Sales() {
  const { sales, total, loading, fetchSales, createSale } = useSaleStore();
  const [activeTab, setActiveTab] = useState<DeliveryStatus | null>(null);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadSales = useCallback(() => {
    fetchSales({ status: activeTab ?? undefined });
  }, [fetchSales, activeTab]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const handleCreateSale = async (data: Parameters<typeof createSale>[0]) => {
    await createSale(data);
    setSaleDialogOpen(false);
    loadSales();
  };

  const handleRowClick = (sale: Sale) => {
    setSelectedSale(sale);
    setDrawerOpen(true);
  };

  const handleStatusUpdated = () => {
    loadSales();
  };

  const handleImported = () => {
    loadSales();
  };

  return (
    <div>
      <Header title="Vendas" />
      <div className="p-6">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-page-bg border border-stroke rounded-lg p-1">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.status)}
                className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-all duration-200 ${
                  activeTab === tab.status
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-secondary hover:text-text-dark hover:bg-card-bg"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setImportDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload size={16} /> Importar CSV
            </button>
            <button
              onClick={() => setSaleDialogOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} /> Nova Venda
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card-bg border border-stroke rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke bg-page-bg">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Qtd
                  </th>
                  <th className="text-left px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Gateway
                  </th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Lucro
                  </th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-stroke/50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-page-bg rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <ShoppingCart
                        size={48}
                        className="mx-auto text-text-muted/40 mb-3"
                      />
                      <p className="text-text-muted text-[14px]">
                        Nenhuma venda encontrada
                      </p>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr
                      key={sale.id}
                      onClick={() => handleRowClick(sale)}
                      className="border-b border-stroke/50 hover:bg-rosa-light/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <p className="text-[14px] font-semibold text-text-dark">
                          {sale.productName}
                        </p>
                        {sale.customerName && (
                          <p className="text-[11px] text-text-muted">
                            {sale.customerName}
                          </p>
                        )}
                      </td>
                      <td className="text-center px-3 py-3 text-[13px] font-semibold text-text-dark">
                        {sale.quantity}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[12px] font-semibold text-text-secondary">
                          {GATEWAY_LABELS[sale.gateway]}
                        </span>
                      </td>
                      <td className="text-right px-3 py-3 text-[13px] font-semibold text-text-dark">
                        {formatBRL(sale.salePrice)}
                      </td>
                      <td className="text-right px-3 py-3">
                        <span
                          className={`text-[13px] font-bold ${sale.profit >= 0 ? "text-green-600" : "text-red-500"}`}
                        >
                          {formatBRL(sale.profit)}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(sale.deliveryStatus)}`}
                        >
                          {DELIVERY_STATUS_LABELS[sale.deliveryStatus]}
                        </span>
                      </td>
                      <td className="text-right px-3 py-3 text-[12px] text-text-muted">
                        {new Date(sale.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer with total count */}
          {!loading && sales.length > 0 && (
            <div className="px-4 py-3 border-t border-stroke bg-page-bg/50">
              <p className="text-[12px] text-text-muted">
                Mostrando {sales.length} de {total} venda{total !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SaleFormDialog
        open={saleDialogOpen}
        onClose={() => setSaleDialogOpen(false)}
        onSubmit={handleCreateSale}
      />

      <ImportCSVDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImported={handleImported}
      />

      <SaleDetailDrawer
        sale={selectedSale}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSale(null);
        }}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}
