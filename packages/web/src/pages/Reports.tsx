import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Header } from "../components/layout/Header.js";
import { useGatewayStore } from "../stores/gateway.store.js";
import { useSettingsStore } from "../stores/settings.store.js";
import { api } from "../lib/api.js";
import { exportSalesXlsx, exportProductsXlsx, exportDashboardXlsx } from "../lib/export-xlsx.js";
import { exportSalesPdf, exportProductsPdf, exportDashboardPdf } from "../lib/export-pdf.js";
import { FileSpreadsheet, FileText, ShoppingCart, Package, LayoutDashboard } from "lucide-react";
import type { Sale, Product, SaleDashboard } from "@mimos/shared";

interface SaleListResponse {
  sales: Sale[];
  total: number;
}

interface ProductListResponse {
  products: Product[];
  total: number;
}

export default function Reports() {
  const { t } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const getGatewayLabel = useGatewayStore((s) => s.getGatewayLabel);
  const allGateways = useGatewayStore((s) => s.getAllGateways)();

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(firstDay.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(lastDay.toISOString().split("T")[0]);
  const [gateway, setGateway] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const tDeliveryStatus = (s: string) => t(`deliveryStatus.${s}`);

  const fetchAllSales = async (): Promise<Sale[]> => {
    const qs = new URLSearchParams();
    qs.set("startDate", new Date(startDate).toISOString());
    qs.set("endDate", new Date(endDate + "T23:59:59.999").toISOString());
    if (gateway) qs.set("gateway", gateway);
    if (status) qs.set("status", status);
    qs.set("limit", "10000");
    qs.set("page", "1");
    const data = await api.get<SaleListResponse>(`/sales?${qs}`);
    return data.sales;
  };

  const fetchAllProducts = async (): Promise<Product[]> => {
    const qs = new URLSearchParams();
    qs.set("limit", "10000");
    qs.set("page", "1");
    const data = await api.get<ProductListResponse>(`/products?${qs}`);
    return data.products;
  };

  const fetchDashboard = async (): Promise<SaleDashboard> => {
    const qs = new URLSearchParams();
    qs.set("startDate", new Date(startDate).toISOString());
    qs.set("endDate", new Date(endDate + "T23:59:59.999").toISOString());
    qs.set("topN", "50");
    return api.get<SaleDashboard>(`/dashboard?${qs}`);
  };

  const handleExport = async (type: string, format: "xlsx" | "pdf") => {
    const key = `${type}-${format}`;
    setLoading(key);
    try {
      const opts = { primaryColor: theme.primary, title: "" };

      if (type === "sales") {
        opts.title = t("reports.salesReport");
        const sales = await fetchAllSales();
        if (sales.length === 0) { toast.info(t("common.noResults")); return; }
        if (format === "xlsx") exportSalesXlsx(sales, getGatewayLabel, tDeliveryStatus, opts);
        else exportSalesPdf(sales, getGatewayLabel, tDeliveryStatus, opts);
      } else if (type === "products") {
        opts.title = t("reports.productsReport");
        const products = await fetchAllProducts();
        if (products.length === 0) { toast.info(t("common.noResults")); return; }
        if (format === "xlsx") exportProductsXlsx(products, opts);
        else exportProductsPdf(products, opts);
      } else if (type === "dashboard") {
        opts.title = t("reports.dashboardReport");
        const dashboard = await fetchDashboard();
        if (format === "xlsx") exportDashboardXlsx(dashboard, getGatewayLabel, opts);
        else exportDashboardPdf(dashboard, getGatewayLabel, opts);
      }

      toast.success(t("reports.exportSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("reports.exportError"));
    } finally {
      setLoading(null);
    }
  };

  const REPORT_CARDS = [
    { type: "sales", labelKey: "reports.salesReport", descKey: "reports.salesDesc", icon: ShoppingCart, color: "text-blue-500", bgColor: "bg-blue-50" },
    { type: "products", labelKey: "reports.productsReport", descKey: "reports.productsDesc", icon: Package, color: "text-green-600", bgColor: "bg-green-50" },
    { type: "dashboard", labelKey: "reports.dashboardReport", descKey: "reports.dashboardDesc", icon: LayoutDashboard, color: "text-purple-600", bgColor: "bg-purple-50" },
  ];

  const STATUSES = ["PENDING", "PREPARING", "IN_TRANSIT", "DELIVERED", "RETURNED", "CANCELLED"];

  return (
    <div>
      <Header title={t("reports.title")} />
      <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="bg-card-bg border border-stroke rounded-xl p-5 animate-fade-in-down">
          <h3 className="text-[14px] font-bold text-text-dark mb-4">{t("reports.filters")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                {t("reports.startDate")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                {t("reports.endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                {t("reports.gateway")}
              </label>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{t("reports.allGateways")}</option>
                {allGateways.map((gw) => (
                  <option key={gw.id} value={gw.id}>{gw.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                {t("reports.status")}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{t("reports.allStatuses")}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`deliveryStatus.${s}`)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REPORT_CARDS.map((card, index) => (
            <div
              key={card.type}
              className="bg-card-bg border border-stroke rounded-xl p-6 hover:shadow-md transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <card.icon size={20} className={card.color} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-text-dark">{t(card.labelKey)}</h3>
                  <p className="text-[12px] text-text-muted">{t(card.descKey)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleExport(card.type, "xlsx")}
                  disabled={loading === `${card.type}-xlsx`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-green-200 bg-green-50 text-green-700 rounded-lg text-[13px] font-semibold hover:bg-green-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <FileSpreadsheet size={16} />
                  {loading === `${card.type}-xlsx` ? t("common.loading") : "Excel"}
                </button>
                <button
                  onClick={() => handleExport(card.type, "pdf")}
                  disabled={loading === `${card.type}-pdf`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-lg text-[13px] font-semibold hover:bg-red-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <FileText size={16} />
                  {loading === `${card.type}-pdf` ? t("common.loading") : "PDF"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
