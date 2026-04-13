import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Header } from "../components/layout/Header.js";
import { useGatewayStore } from "../stores/gateway.store.js";
import { useSettingsStore } from "../stores/settings.store.js";
import { getFirstDayOfMonthISO, getLastDayOfMonthISO, getDateParts, formatDate, formatDateTime } from "../lib/timezone.js";
import { api } from "../lib/api.js";
import { exportSalesXlsx, exportProductsXlsx, exportDashboardXlsx } from "../lib/export-xlsx.js";
import { exportSalesPdf, exportProductsPdf, exportDashboardPdf } from "../lib/export-pdf.js";
import { formatBRL } from "@mimos/shared";
import type { Sale, Product, SaleDashboard } from "@mimos/shared";
import { FileSpreadsheet, FileText, ShoppingCart, Package, LayoutDashboard, BarChart3, TrendingUp, MapPin, Clock, ChevronDown, ChevronLeft, ChevronRight, List } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface SaleListResponse { sales: Sale[]; total: number }
interface ProductListResponse { products: Product[]; total: number }

const PIE_COLORS = ["#ff914d", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#F59E0B", "#06B6D4", "#EF4444", "#6B7280", "#DC2626"];
const SALES_PER_PAGE = 15;
const DAYS_PT = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Reports() {
  const { t, i18n } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const getGatewayLabel = useGatewayStore((s) => s.getGatewayLabel);
  const allGateways = useGatewayStore((s) => s.getAllGateways)();

  const [startDate, setStartDate] = useState(getFirstDayOfMonthISO);
  const [endDate, setEndDate] = useState(getLastDayOfMonthISO);
  const [gateway, setGateway] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showSalesList, setShowSalesList] = useState(false);
  const [salesPage, setSalesPage] = useState(1);

  const tDeliveryStatus = (s: string) => t(`deliveryStatus.${s}`);
  const dayNames = i18n.language === "pt-BR" ? DAYS_PT : DAYS_EN;

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

  // Load insights data
  useEffect(() => {
    const load = async () => {
      setInsightsLoading(true);
      try {
        const data = await fetchAllSales();
        setSales(data);
        setSalesPage(1);
      } catch { /* ignore */ }
      setInsightsLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, gateway, status]);

  // Computed insights
  const insights = useMemo(() => {
    if (sales.length === 0) return null;

    // By state
    const stateMap = new Map<string, { count: number; revenue: number }>();
    // By gender
    const genderMap = new Map<string, { count: number; revenue: number }>();
    // By hour
    const hourMap = new Map<number, { count: number; revenue: number }>();
    // By day of week
    const dowMap = new Map<number, { count: number; revenue: number }>();
    // By gateway
    const gwMap = new Map<string, { count: number; revenue: number; profit: number }>();

    let totalRevenue = 0;
    let totalProfit = 0;

    for (const sale of sales) {
      totalRevenue += sale.salePrice;
      totalProfit += sale.profit;

      const state = sale.customerState || t("reports.unknown");
      const prev = stateMap.get(state) ?? { count: 0, revenue: 0 };
      stateMap.set(state, { count: prev.count + 1, revenue: prev.revenue + sale.salePrice });

      const gender = sale.customerGender === "M" ? t("sales.genderMale") : sale.customerGender === "F" ? t("sales.genderFemale") : sale.customerGender === "O" ? t("sales.genderOther") : t("reports.unknown");
      const gPrev = genderMap.get(gender) ?? { count: 0, revenue: 0 };
      genderMap.set(gender, { count: gPrev.count + 1, revenue: gPrev.revenue + sale.salePrice });

      const dateParts = getDateParts(sale.saleDate);
      const hour = dateParts.hour;
      const hPrev = hourMap.get(hour) ?? { count: 0, revenue: 0 };
      hourMap.set(hour, { count: hPrev.count + 1, revenue: hPrev.revenue + sale.salePrice });

      const dow = dateParts.dow;
      const dPrev = dowMap.get(dow) ?? { count: 0, revenue: 0 };
      dowMap.set(dow, { count: dPrev.count + 1, revenue: dPrev.revenue + sale.salePrice });

      const gwLabel = getGatewayLabel(sale.gateway);
      const gwPrev = gwMap.get(gwLabel) ?? { count: 0, revenue: 0, profit: 0 };
      gwMap.set(gwLabel, { count: gwPrev.count + 1, revenue: gwPrev.revenue + sale.salePrice, profit: gwPrev.profit + sale.profit });
    }

    const byState = [...stateMap.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const byGender = [...genderMap.entries()]
      .map(([name, data]) => ({ name, ...data }));

    const byHour = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, "0")}:00 ${h < 6 ? t("reports.periodDawn") : h < 12 ? t("reports.periodMorning") : h < 18 ? t("reports.periodAfternoon") : t("reports.periodNight")}`,
      count: hourMap.get(h)?.count ?? 0,
      revenue: hourMap.get(h)?.revenue ?? 0,
    }));

    const byDow = Array.from({ length: 7 }, (_, d) => ({
      day: dayNames[d],
      count: dowMap.get(d)?.count ?? 0,
      revenue: dowMap.get(d)?.revenue ?? 0,
    }));

    const byGateway = [...gwMap.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    const avgTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Best hour
    const bestHour = byHour.reduce((best, h) => h.count > best.count ? h : best, byHour[0]);
    // Best day
    const bestDay = byDow.reduce((best, d) => d.count > best.count ? d : best, byDow[0]);
    // Top state
    const topState = byState[0];

    return { byState, byGender, byHour, byDow, byGateway, totalRevenue, totalProfit, avgTicket, profitMargin, bestHour, bestDay, topState, totalSales: sales.length };
  }, [sales, getGatewayLabel, t, dayNames]);

  const handleExport = async (type: string, format: "xlsx" | "pdf") => {
    const key = `${type}-${format}`;
    setLoading(key);
    try {
      const opts = { primaryColor: theme.primary, title: "" };
      if (type === "sales") {
        opts.title = t("reports.salesReport");
        const data = sales.length > 0 ? sales : await fetchAllSales();
        if (data.length === 0) { toast.info(t("common.noResults")); return; }
        if (format === "xlsx") exportSalesXlsx(data, getGatewayLabel, tDeliveryStatus, opts);
        else exportSalesPdf(data, getGatewayLabel, tDeliveryStatus, opts);
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
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("reports.startDate")}</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("reports.endDate")}</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("reports.gateway")}</label>
              <select value={gateway} onChange={(e) => setGateway(e.target.value)} className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">{t("reports.allGateways")}</option>
                {allGateways.map((gw) => (<option key={gw.id} value={gw.id}>{gw.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("reports.status")}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[13px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">{t("reports.allStatuses")}</option>
                {STATUSES.map((s) => (<option key={s} value={s}>{t(`deliveryStatus.${s}`)}</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* KPI Summary */}
        {insights && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-in-up">
            <KpiCard icon={<ShoppingCart size={18} />} label={t("reports.totalSales")} value={String(insights.totalSales)} color="text-blue-500" bg="bg-blue-50" />
            <KpiCard icon={<TrendingUp size={18} />} label={t("reports.totalRevenue")} value={formatBRL(insights.totalRevenue)} color="text-green-600" bg="bg-green-50" />
            <KpiCard icon={<BarChart3 size={18} />} label={t("reports.totalProfit")} value={formatBRL(insights.totalProfit)} color="text-primary" bg="bg-orange-50" />
            <KpiCard icon={<TrendingUp size={18} />} label={t("reports.avgTicket")} value={formatBRL(insights.avgTicket)} color="text-purple-600" bg="bg-purple-50" />
            <KpiCard icon={<TrendingUp size={18} />} label={t("reports.profitMargin")} value={`${insights.profitMargin.toFixed(1)}%`} color="text-cyan-600" bg="bg-cyan-50" />
          </div>
        )}

        {/* Insights highlight cards */}
        {insights && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            {insights.bestHour && (
              <div className="bg-card-bg border border-stroke rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-blue-500" />
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("reports.bestHour")}</span>
                </div>
                <p className="text-[22px] font-bold text-text-dark">{insights.bestHour.hour}</p>
                <p className="text-[12px] text-text-muted">{insights.bestHour.count} {t("reports.salesLabel")}</p>
              </div>
            )}
            {insights.bestDay && (
              <div className="bg-card-bg border border-stroke rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={16} className="text-green-600" />
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("reports.bestDay")}</span>
                </div>
                <p className="text-[22px] font-bold text-text-dark">{insights.bestDay.day}</p>
                <p className="text-[12px] text-text-muted">{insights.bestDay.count} {t("reports.salesLabel")}</p>
              </div>
            )}
            {insights.topState && (
              <div className="bg-card-bg border border-stroke rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-red-500" />
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("reports.topState")}</span>
                </div>
                <p className="text-[22px] font-bold text-text-dark">{insights.topState.name}</p>
                <p className="text-[12px] text-text-muted">{insights.topState.count} {t("reports.salesLabel")} &middot; {formatBRL(insights.topState.revenue)}</p>
              </div>
            )}
          </div>
        )}

        {/* Charts */}
        {insights && !insightsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by hour */}
            <div className="bg-card-bg border border-stroke rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
              <h3 className="text-[14px] font-bold text-text-dark mb-4">{t("reports.salesByHour")}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={insights.byHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v, t("reports.salesLabel")]} />
                  <Bar dataKey="count" fill={theme.primary} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sales by day of week */}
            <div className="bg-card-bg border border-stroke rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <h3 className="text-[14px] font-bold text-text-dark mb-4">{t("reports.salesByDow")}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={insights.byDow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v, t("reports.salesLabel")]} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sales by gender */}
            <div className="bg-card-bg border border-stroke rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: "250ms" }}>
              <h3 className="text-[14px] font-bold text-text-dark mb-4">{t("reports.salesByGender")}</h3>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={insights.byGender} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {insights.byGender.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {insights.byGender.map((g, i) => (
                    <div key={g.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[12px] text-text-dark font-medium">{g.name}</span>
                      <span className="text-[11px] text-text-muted">({g.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sales by state (top 10) */}
            <div className="bg-card-bg border border-stroke rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <h3 className="text-[14px] font-bold text-text-dark mb-4">{t("reports.salesByState")}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={insights.byState} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={40} />
                  <Tooltip formatter={(v: number) => [v, t("reports.salesLabel")]} />
                  <Bar dataKey="count" fill="#10B981" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by gateway */}
            <div className="bg-card-bg border border-stroke rounded-xl p-5 animate-fade-in-up lg:col-span-2" style={{ animationDelay: "350ms" }}>
              <h3 className="text-[14px] font-bold text-text-dark mb-4">{t("reports.revenueByGateway")}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={insights.byGateway}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatBRL(v)} />
                  <Tooltip formatter={(v: number) => [formatBRL(v)]} />
                  <Bar dataKey="revenue" fill={theme.primary} radius={[3, 3, 0, 0]} name={t("reports.totalRevenue")} />
                  <Bar dataKey="profit" fill="#10B981" radius={[3, 3, 0, 0]} name={t("reports.totalProfit")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {insightsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card-bg border border-stroke rounded-xl p-5 h-[280px] animate-pulse" />
            ))}
          </div>
        )}

        {/* Sales List Toggle */}
        {sales.length > 0 && !insightsLoading && (
          <div className="bg-card-bg border border-stroke rounded-xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <button
              onClick={() => { setShowSalesList(!showSalesList); setSalesPage(1); }}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-page-bg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <List size={18} className="text-blue-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-[14px] font-bold text-text-dark">{t("reports.salesList")}</h3>
                  <p className="text-[12px] text-text-muted">{sales.length} {t("reports.salesLabel")} &middot; {t("reports.salesListDesc")}</p>
                </div>
              </div>
              <ChevronDown size={18} className={`text-text-muted transition-transform duration-200 ${showSalesList ? "rotate-180" : ""}`} />
            </button>

            {showSalesList && <SalesListTable sales={sales} salesPage={salesPage} setSalesPage={setSalesPage} getGatewayLabel={getGatewayLabel} />}
          </div>
        )}

        {/* Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REPORT_CARDS.map((card, index) => (
            <div key={card.type} className="bg-card-bg border border-stroke rounded-xl p-6 hover:shadow-md transition-all duration-200 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
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
                <button onClick={() => handleExport(card.type, "xlsx")} disabled={loading === `${card.type}-xlsx`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-green-200 bg-green-50 text-green-700 rounded-lg text-[13px] font-semibold hover:bg-green-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                  <FileSpreadsheet size={16} />
                  {loading === `${card.type}-xlsx` ? t("common.loading") : "Excel"}
                </button>
                <button onClick={() => handleExport(card.type, "pdf")} disabled={loading === `${card.type}-pdf`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-lg text-[13px] font-semibold hover:bg-red-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
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

function KpiCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="bg-card-bg border border-stroke rounded-xl p-4 hover:shadow-md transition-all">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${color} mb-2`}>{icon}</div>
      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-[18px] font-bold text-text-dark tracking-tight mt-0.5">{value}</p>
    </div>
  );
}

function SalesListTable({ sales, salesPage, setSalesPage, getGatewayLabel }: {
  sales: Sale[];
  salesPage: number;
  setSalesPage: (p: number | ((prev: number) => number)) => void;
  getGatewayLabel: (id: string) => string;
}) {
  const { t, i18n } = useTranslation();
  const totalPages = Math.ceil(sales.length / SALES_PER_PAGE);
  const paged = sales.slice((salesPage - 1) * SALES_PER_PAGE, salesPage * SALES_PER_PAGE);

  return (
    <div className="border-t border-stroke">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-stroke bg-page-bg/50">
              <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.product")}</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.customer")}</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.gateway")}</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-right">{t("reports.qty")}</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-right">{t("reports.saleValue")}</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-right">{t("reports.cost")}</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-right">{t("reports.fees")}</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-right">{t("sales.profit")}</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("sales.date")}</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((sale) => (
              <tr key={sale.id} className="border-b border-stroke/50 hover:bg-page-bg/50 transition-colors">
                <td className="px-4 py-3 text-[13px] text-text-dark">
                  {sale.items.map((item) => item.productName).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-[13px] text-text-secondary">{sale.customerName || sale.shopeeUsername || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-text-secondary">{getGatewayLabel(sale.gateway)}</td>
                <td className="px-4 py-3 text-[13px] text-text-dark text-right">{sale.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                <td className="px-4 py-3 text-[13px] text-text-dark text-right font-medium">{formatBRL(sale.salePrice)}</td>
                <td className="px-4 py-3 text-[13px] text-text-secondary text-right">{formatBRL(sale.totalCost)}</td>
                <td className="px-4 py-3 text-[13px] text-text-secondary text-right">{formatBRL(sale.totalFees)}</td>
                <td className={`px-4 py-3 text-[13px] text-right font-semibold ${sale.profit >= 0 ? "text-green-600" : "text-red-500"}`}>{formatBRL(sale.profit)}</td>
                <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">{formatDate(sale.saleDate, i18n.language)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-stroke bg-page-bg/30">
          <p className="text-[12px] text-text-muted">
            {t("reports.page")} {salesPage} {t("reports.of")} {totalPages} &middot; {sales.length} {t("reports.salesLabel")}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSalesPage((p) => Math.max(1, p - 1))}
              disabled={salesPage === 1}
              className="p-1.5 rounded-lg border border-stroke hover:bg-card-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} className="text-text-muted" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (salesPage <= 3) {
                page = i + 1;
              } else if (salesPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = salesPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setSalesPage(page)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-semibold transition-all ${salesPage === page ? "bg-primary text-white shadow-sm" : "text-text-muted hover:bg-card-bg border border-stroke"}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setSalesPage((p) => Math.min(totalPages, p + 1))}
              disabled={salesPage === totalPages}
              className="p-1.5 rounded-lg border border-stroke hover:bg-card-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} className="text-text-muted" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
