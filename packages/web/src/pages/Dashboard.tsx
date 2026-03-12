import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/layout/Header.js";
import { useDashboardStore } from "../stores/dashboard.store.js";
import { useGatewayStore } from "../stores/gateway.store.js";
import { useSettingsStore } from "../stores/settings.store.js";
import { formatBRL } from "@mimos/shared";
import { format } from "date-fns";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Package,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import { ExportDropdown } from "../components/common/ExportDropdown.js";
import { exportDashboardXlsx } from "../lib/export-xlsx.js";
import { exportDashboardPdf } from "../lib/export-pdf.js";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TOP_N_OPTIONS = [5, 10, 20, 50];

export default function Dashboard() {
  const { t } = useTranslation();
  const { data, loading, fetchDashboard } = useDashboardStore();
  const getGatewayLabel = useGatewayStore((s) => s.getGatewayLabel);
  const theme = useSettingsStore((s) => s.theme);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showFilter, setShowFilter] = useState(false);
  const [topN, setTopN] = useState(5);

  const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  useEffect(() => {
    const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999).toISOString();
    fetchDashboard(startDate, endDate, topN);
  }, [fetchDashboard, selectedMonth, selectedYear, topN]);

  const STAT_CARDS = [
    { key: "totalSalesToday" as const, label: t("dashboard.salesToday"), icon: ShoppingCart, format: (v: number) => String(v) },
    { key: "revenueMonth" as const, label: t("dashboard.revenueMonth"), icon: DollarSign, format: formatBRL },
    { key: "profitMonth" as const, label: t("dashboard.profitMonth"), icon: TrendingUp, format: formatBRL },
    { key: "averageTicket" as const, label: t("dashboard.averageTicket"), icon: Receipt, format: formatBRL },
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const salesByDayFormatted = useMemo(() => {
    return (data?.salesByDay ?? []).map((d) => ({
      ...d,
      label: format(new Date(d.date), "dd/MM"),
    }));
  }, [data?.salesByDay]);

  const topProductsFormatted = useMemo(() => {
    return data?.topProducts ?? [];
  }, [data?.topProducts]);

  const PIE_COLORS = [
    theme.primary, theme.sidebarBg, "#e8a5ae", "#6B5E5E", "#fac6cd",
    "#4CAF50", "#2196F3", "#9C27B0", "#FF5722", "#00BCD4",
  ];

  return (
    <div>
      <Header title={t("dashboard.title")} />
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 animate-fade-in">
        {/* Month/Year Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2.5 bg-card-bg border border-stroke rounded-xl text-[13px] font-semibold text-text-dark hover:bg-page-bg transition-colors"
            >
              <CalendarDays size={16} className="text-primary" />
              {t(`months.${selectedMonth}`)} {selectedYear}
              <ChevronDown size={14} className={`text-text-muted transition-transform ${showFilter ? "rotate-180" : ""}`} />
            </button>
            {showFilter && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-card-bg border border-stroke rounded-xl shadow-lg p-4 animate-fade-in-down min-w-[280px]">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                      {t("dashboard.selectMonth")}
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stroke rounded-lg text-[13px] text-text-dark bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>{t(`months.${m}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                      {t("dashboard.selectYear")}
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stroke rounded-lg text-[13px] text-text-dark bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {!isCurrentMonth && (
                  <button
                    onClick={() => { setSelectedMonth(now.getMonth() + 1); setSelectedYear(now.getFullYear()); }}
                    className="text-[12px] text-primary font-semibold hover:underline"
                  >
                    {t("dashboard.currentMonth")}
                  </button>
                )}
              </div>
            )}
          </div>
          {!isCurrentMonth && (
            <span className="text-[12px] text-text-muted">
              {t(`months.${selectedMonth}`)} {selectedYear}
            </span>
          )}
          {data && (
            <div className="ml-auto">
              <ExportDropdown
                onExcel={() => exportDashboardXlsx(data, getGatewayLabel, { primaryColor: theme.primary, title: t("reports.dashboardReport") })}
                onPdf={() => exportDashboardPdf(data, getGatewayLabel, { primaryColor: theme.primary, title: t("reports.dashboardReport") })}
              />
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAT_CARDS.map((card, index) => (
            <div
              key={card.key}
              className="bg-card-bg border border-stroke rounded-xl p-5 hover:shadow-md transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">
                  {card.label}
                </span>
                <div className="w-9 h-9 bg-rosa-light rounded-lg flex items-center justify-center">
                  <card.icon size={18} className="text-primary" />
                </div>
              </div>
              <p className="text-[28px] font-extrabold text-text-dark tracking-tight">
                {loading ? "\u2014" : data ? card.format(data[card.key] as number) : "\u2014"}
              </p>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        {data && data.lowStockProducts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 animate-fade-in-up shadow-sm" style={{ animationDelay: "320ms" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center animate-pulse">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-red-800">{t("dashboard.lowStock")}</h3>
                <p className="text-[12px] text-red-600/80">{t("dashboard.lowStockWarning")}</p>
              </div>
              <span className="ml-auto bg-red-200 text-red-800 text-[13px] font-extrabold px-3 py-1 rounded-full">
                {data.lowStockProducts.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {data.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 rounded-lg px-3.5 py-3 border transition-all ${
                    product.quantity === 0
                      ? "bg-red-100 border-red-300"
                      : "bg-white border-red-100"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    product.quantity === 0 ? "bg-red-200" : "bg-yellow-100"
                  }`}>
                    {product.quantity === 0 ? (
                      <AlertTriangle size={16} className="text-red-600" />
                    ) : (
                      <Package size={16} className="text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text-dark truncate">{product.name}</p>
                    <p className="text-[11px] text-text-muted">{product.supplier ?? t("dashboard.noSupplier")}</p>
                  </div>
                  <span className={`text-[14px] font-extrabold shrink-0 ${
                    product.quantity === 0 ? "text-red-600" : "text-yellow-600"
                  }`}>
                    {product.quantity === 0 ? t("dashboard.outOfStock") : `${product.quantity} ${t("dashboard.units")}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Day Chart */}
          <div className="bg-card-bg border border-stroke rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <h3 className="text-[15px] font-bold text-text-dark mb-4">{t("dashboard.salesByDay")}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={salesByDayFormatted}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.stroke} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "count" ? value : formatBRL(value),
                    name === "count" ? t("dashboard.chartSales") : t("dashboard.chartRevenue"),
                  ]}
                  labelFormatter={(label) => label}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  name="count"
                  stroke={theme.primary}
                  strokeWidth={2.5}
                  dot={{ fill: theme.primary, r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke={theme.sidebarBg}
                  strokeWidth={2}
                  dot={{ fill: theme.sidebarBg, r: 3 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sales by Gateway Chart */}
          <div className="bg-card-bg border border-stroke rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <h3 className="text-[15px] font-bold text-text-dark mb-4">{t("dashboard.salesByGateway")}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={
                  data?.salesByGateway?.map((g) => ({
                    ...g,
                    name: getGatewayLabel(g.gateway),
                  })) ?? []
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.stroke} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [formatBRL(value), t("dashboard.chartRevenue")]} />
                <Bar dataKey="revenue" name={t("dashboard.chartRevenue")} fill={theme.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products Chart */}
          <div className="bg-card-bg border border-stroke rounded-xl p-6 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-text-dark">{t("dashboard.topProducts")}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-muted">{t("dashboard.topNSelector")}</span>
                <select
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value))}
                  className="px-2 py-1.5 border border-stroke rounded-lg text-[13px] text-text-dark bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {TOP_N_OPTIONS.map((n) => (
                    <option key={n} value={n}>Top {n}</option>
                  ))}
                </select>
              </div>
            </div>
            {topProductsFormatted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <Package size={36} className="mb-3 opacity-40" />
                <p className="text-[13px]">{t("common.noResults")}</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Pie chart */}
                <div className="flex-1 min-w-0">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={topProductsFormatted}
                        dataKey="revenue"
                        nameKey="productName"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={50}
                        paddingAngle={2}
                        label={({ productName, percent }) =>
                          `${productName.length > 14 ? productName.slice(0, 12) + "…" : productName} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {topProductsFormatted.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [formatBRL(v), t("dashboard.chartRevenue")]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Products list with images */}
                <div className="w-full lg:w-[300px] shrink-0 space-y-2 max-h-[400px] overflow-y-auto">
                  {topProductsFormatted.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-page-bg border border-stroke/50 hover:shadow-sm transition-all">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <div className="w-8 h-8 rounded-lg bg-card-bg border border-stroke flex items-center justify-center overflow-hidden shrink-0">
                        {p.productImageUrl ? (
                          <img src={p.productImageUrl} alt={p.productName} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={14} className="text-text-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-text-dark truncate">{p.productName}</p>
                        <p className="text-[11px] text-text-muted">{p.count}x &middot; {formatBRL(p.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
