import { useEffect } from "react";
import { Header } from "../components/layout/Header.js";
import { useDashboardStore } from "../stores/dashboard.store.js";
import { formatBRL, GATEWAY_LABELS } from "@mimos/shared";
import { ShoppingCart, DollarSign, TrendingUp, Receipt } from "lucide-react";
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

const STAT_CARDS = [
  { key: "totalSalesToday", label: "Vendas Hoje", icon: ShoppingCart, format: (v: number) => String(v) },
  { key: "revenueMonth", label: "Faturamento Mês", icon: DollarSign, format: formatBRL },
  { key: "profitMonth", label: "Lucro Mês", icon: TrendingUp, format: formatBRL },
  { key: "averageTicket", label: "Ticket Médio", icon: Receipt, format: formatBRL },
] as const;

const PIE_COLORS = ["#ff914d", "#fac6cd", "#3D2C2C", "#6B5E5E", "#e8a5ae"];

export default function Dashboard() {
  const { data, loading, fetchDashboard } = useDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAT_CARDS.map((card) => (
            <div
              key={card.key}
              className="bg-card-bg border border-stroke rounded-xl p-5 hover:shadow-md transition-all duration-200"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Day Chart */}
          <div className="bg-card-bg border border-stroke rounded-xl p-6">
            <h3 className="text-[15px] font-bold text-text-dark mb-4">Vendas por Dia</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data?.salesByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#ff914d"
                  strokeWidth={2.5}
                  dot={{ fill: "#ff914d", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sales by Gateway Chart */}
          <div className="bg-card-bg border border-stroke rounded-xl p-6">
            <h3 className="text-[15px] font-bold text-text-dark mb-4">Vendas por Gateway</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={
                  data?.salesByGateway?.map((g) => ({
                    ...g,
                    name: GATEWAY_LABELS[g.gateway] ?? g.gateway,
                  })) ?? []
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#ff914d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products Chart */}
          <div className="bg-card-bg border border-stroke rounded-xl p-6 lg:col-span-2">
            <h3 className="text-[15px] font-bold text-text-dark mb-4">Top 5 Produtos</h3>
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
                <Tooltip formatter={(v: number) => formatBRL(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
