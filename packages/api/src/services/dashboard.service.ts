import { prisma } from "../lib/prisma.js";

export async function getDashboardData(params: { startDate?: string; endDate?: string }) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const dateFilter = params.startDate || params.endDate
    ? {
        createdAt: {
          ...(params.startDate && { gte: new Date(params.startDate) }),
          ...(params.endDate && { lte: new Date(params.endDate) }),
        },
      }
    : {};

  const [todaySales, monthSales, salesByGateway, salesByDay, topProducts] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _count: true,
      _sum: { salePrice: true, profit: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth }, ...dateFilter },
      _count: true,
      _sum: { salePrice: true, profit: true, netRevenue: true },
    }),
    prisma.sale.groupBy({
      by: ["gateway"],
      where: { createdAt: { gte: startOfMonth }, ...dateFilter },
      _count: true,
      _sum: { salePrice: true },
    }),
    prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*)::int as count, SUM(sale_price) as revenue
      FROM sales
      WHERE created_at >= ${startOfMonth}
      GROUP BY DATE(created_at)
      ORDER BY date
    ` as Promise<{ date: string; count: number; revenue: number }[]>,
    prisma.sale.groupBy({
      by: ["productId"],
      where: { createdAt: { gte: startOfMonth }, ...dateFilter },
      _count: true,
      _sum: { salePrice: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
  ]);

  const topProductIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  return {
    totalSalesToday: todaySales._count,
    totalSalesMonth: monthSales._count,
    revenueMonth: monthSales._sum.salePrice ?? 0,
    profitMonth: monthSales._sum.profit ?? 0,
    averageTicket: monthSales._count > 0 ? (monthSales._sum.salePrice ?? 0) / monthSales._count : 0,
    salesByGateway: salesByGateway.map((g) => ({
      gateway: g.gateway,
      count: g._count,
      revenue: g._sum.salePrice ?? 0,
    })),
    salesByDay,
    topProducts: topProducts.map((p) => ({
      productName: productMap.get(p.productId) ?? "Desconhecido",
      count: p._count,
      revenue: p._sum.salePrice ?? 0,
    })),
  };
}
