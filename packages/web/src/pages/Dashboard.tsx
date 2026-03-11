import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/layout/Header.js";
import { useDashboardStore } from "../stores/dashboard.store.js";
import { useGatewayStore } from "../stores/gateway.store.js";
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

const PIE_COLORS = ["#ff914d", "#fac6cd", "#3D2C2C", "#6B5E5E", "#e8a5ae"];

export default function Dashboard() {
  const { t } = useTranslation();
  const { data, loading, fetchDashboard } = useDashboardStore();
  const getGatewayLabel = useGatewayStore((s) => s.getGatewayLabel);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showFilter, setShowFilter] = useState(false);

  const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  useEffect(() => {
    const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999).toISOString();
    fetchDashboard(startDate, endDate);
  }, [fetchDashboard, selectedMonth, selectedYear]);

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
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: "320ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-yellow-600" />
              <h3 className="text-[15px] font-bold text-yellow-800">{t("dashboard.lowStock")}</h3>
              <span className="ml-auto bg-yellow-200 text-yellow-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {data.lowStockProducts.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-yellow-100"
                >
                  <Package size={16} className="text-yellow-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text-dark truncate">{product.name}</p>
                    <p className="text-[11px] text-text-muted">{product.supplier ?? t("dashboard.noSupplier")}</p>
                  </div>
                  <span className={`text-[13px] font-bold shrink-0 ${product.quantity === 0 ? "text-red-600" : "text-yellow-600"}`}>
                    {product.quantity} {t("dashboard.units")}
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "count" ? value : formatBRL(value),
                    name === "count" ? t("dashboard.chartSales") : t("dashboard.chartRevenue"),
                  ]}
                  labelFormatter={(label) => label}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t("dashboard.chartSales")}
                  stroke="#ff914d"
                  strokeWidth={2.5}
                  dot={{ fill: "#ff914d", r: 4 }}
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [formatBRL(value), t("dashboard.chartRevenue")]} />
                <Bar dataKey="revenue" name={t("dashboard.chartRevenue")} fill="#ff914d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products Chart */}
          <div className="bg-card-bg border border-stroke rounded-xl p-6 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <h3 className="text-[15px] font-bold text-text-dark mb-4">{t("dashboard.topProducts")}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data?.topProducts ?? []}
                  dataKey="revenue"
                  nameKey="productName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ productName }) => productName}
                >
                  {data?.topProducts?.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [formatBRL(v), t("dashboard.chartRevenue")]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
