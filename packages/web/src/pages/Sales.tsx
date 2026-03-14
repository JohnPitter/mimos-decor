import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/layout/Header.js";
import { SaleFormDialog } from "../components/sales/SaleFormDialog.js";
import { SaleDetailDrawer } from "../components/sales/SaleDetailDrawer.js";
import { ImportCSVDialog } from "../components/sales/ImportCSVDialog.js";
import { ConfirmDialog } from "../components/common/ConfirmDialog.js";
import { useSaleStore } from "../stores/sale.store.js";
import { useGatewayStore } from "../stores/gateway.store.js";
import {
  formatBRL,
  DELIVERY_STATUS_COLORS,
} from "@mimos/shared";
import type { Sale, DeliveryStatus } from "@mimos/shared";
import { Plus, Upload, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ExportDropdown } from "../components/common/ExportDropdown.js";
import { useSettingsStore } from "../stores/settings.store.js";
import { exportSalesXlsx } from "../lib/export-xlsx.js";
import { exportSalesPdf } from "../lib/export-pdf.js";

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

interface StatusTab {
  labelKey: string;
  status: DeliveryStatus | null;
}

const TABS: StatusTab[] = [
  { labelKey: "all", status: null },
  { labelKey: "PENDING", status: "PENDING" },
  { labelKey: "PREPARING", status: "PREPARING" },
  { labelKey: "IN_TRANSIT", status: "IN_TRANSIT" },
  { labelKey: "DELIVERED", status: "DELIVERED" },
];

export default function Sales() {
  const { t } = useTranslation();
  const { sales, total, loading, fetchSales, createSale, deleteSale } = useSaleStore();
  const getGatewayLabel = useGatewayStore((s) => s.getGatewayLabel);
  const theme = useSettingsStore((s) => s.theme);
  const appSettings = useSettingsStore((s) => s.appSettings);
  const fetchAppSettings = useSettingsStore((s) => s.fetchAppSettings);
  const [activeTab, setActiveTab] = useState<DeliveryStatus | null>(null);
  const [page, setPage] = useState(1);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const loadSales = useCallback(() => {
    fetchSales({ status: activeTab ?? undefined, page });
  }, [fetchSales, activeTab, page]);

  useEffect(() => { setPage(1); }, [activeTab]);
  useEffect(() => { loadSales(); }, [loadSales]);
  useEffect(() => { fetchAppSettings(); }, [fetchAppSettings]);

  const handleCreateSale = async (data: Parameters<typeof createSale>[0]) => {
    await createSale(data);
    setSaleDialogOpen(false);
    loadSales();
  };

  const handleRowClick = (sale: Sale) => {
    setSelectedSale(sale);
    setDrawerOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteSale(deleteId);
      toast.success(t("sales.deleteSuccess"));
      loadSales();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sales.deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div>
      <Header title={t("sales.title")} />
      <div className="p-4 sm:p-6 animate-fade-in">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 animate-fade-in-down">
          <div className="flex items-center gap-1 bg-page-bg border border-stroke rounded-lg p-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.labelKey}
                onClick={() => setActiveTab(tab.status)}
                className={`px-3 sm:px-4 py-2 rounded-md text-[12px] sm:text-[13px] font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.status
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-secondary hover:text-text-dark hover:bg-card-bg"
                }`}
              >
                {tab.labelKey === "all" ? t("common.total") : t(`deliveryStatus.${tab.labelKey}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ExportDropdown
              onExcel={() => exportSalesXlsx(sales, getGatewayLabel, (s) => t(`deliveryStatus.${s}`), { primaryColor: theme.primary, title: t("reports.salesReport") })}
              onPdf={() => exportSalesPdf(sales, getGatewayLabel, (s) => t(`deliveryStatus.${s}`), { primaryColor: theme.primary, title: t("reports.salesReport") })}
            />
            <button
              onClick={() => setImportDialogOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border border-stroke rounded-lg text-[13px] sm:text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload size={16} /> <span className="hidden sm:inline">{t("sales.importCSV")}</span><span className="sm:hidden">CSV</span>
            </button>
            <button
              onClick={() => setSaleDialogOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-3 sm:px-4 py-2.5 rounded-lg font-semibold text-[13px] sm:text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} /> {t("sales.newSale")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card-bg border border-stroke rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke bg-page-bg">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.product")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.quantity")}</th>
                  <th className="text-left px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.gateway")}</th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.salePrice")}</th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.profit")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.status")}</th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.date")}</th>
                  <th className="px-3 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-stroke/50">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-page-bg rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <ShoppingCart size={48} className="mx-auto text-text-muted/40 mb-3" />
                      <p className="text-text-muted text-[14px]">{t("common.noResults")}</p>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale, index) => (
                    <tr
                      key={sale.id}
                      onClick={() => handleRowClick(sale)}
                      className="border-b border-stroke/50 hover:bg-rosa-light/30 transition-colors cursor-pointer animate-fade-in-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-4 py-3">
                        <p className="text-[14px] font-semibold text-text-dark">
                          {sale.items.length > 0
                            ? sale.items[0].productName + (sale.items.length > 1 ? ` +${sale.items.length - 1}` : "")
                            : "—"}
                        </p>
                        {sale.customerName && <p className="text-[11px] text-text-muted">{sale.customerName}</p>}
                      </td>
                      <td className="text-center px-3 py-3 text-[13px] font-semibold text-text-dark">
                        {sale.items.reduce((sum, i) => sum + i.quantity, 0)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[12px] font-semibold text-text-secondary">{getGatewayLabel(sale.gateway)}</span>
                      </td>
                      <td className="text-right px-3 py-3 text-[13px] font-semibold text-text-dark">
                        {formatBRL(sale.salePrice)}
                      </td>
                      <td className="text-right px-3 py-3">
                        <span className={`text-[13px] font-bold ${sale.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {formatBRL(sale.profit)}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(sale.deliveryStatus)}`}>
                          {t(`deliveryStatus.${sale.deliveryStatus}`)}
                        </span>
                      </td>
                      <td className="text-right px-3 py-3 text-[12px] text-text-muted">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        {appSettings.allowSaleDeletion && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(sale.id); }}
                            className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && sales.length > 0 && (
            <div className="px-4 py-3 border-t border-stroke bg-page-bg/50">
              <p className="text-[12px] text-text-muted">
                {sales.length} {t("common.of")} {total} {t("common.items")}
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stroke hover:bg-neutral-bg2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("common.previous")}
            </button>
            <span className="text-xs text-text-muted">{page} {t("common.of")} {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stroke hover:bg-neutral-bg2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </div>

      <SaleFormDialog open={saleDialogOpen} onClose={() => setSaleDialogOpen(false)} onSubmit={handleCreateSale} />
      <ImportCSVDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} onImported={() => loadSales()} />
      <SaleDetailDrawer sale={selectedSale} open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedSale(null); }} onStatusUpdated={() => loadSales()} />
      <ConfirmDialog
        open={!!deleteId}
        title={t("nav.deleteConfirmTitle")}
        message={t("sales.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
