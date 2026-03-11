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

  const [todaySales, monthSales, salesByGateway, salesByDay, topProducts, lowStockProducts] = await Promise.all([
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
    prisma.$queryRaw`
      SELECT si.product_id as "productId", COUNT(*)::int as count, SUM(si.sale_price * si.quantity) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= ${startOfMonth}
      GROUP BY si.product_id
      ORDER BY count DESC
      LIMIT 5
    ` as Promise<{ productId: string; count: number; revenue: number }[]>,
    prisma.product.findMany({
      where: { quantity: { lte: 5 } },
      select: { id: true, name: true, quantity: true, supplier: true },
      orderBy: { quantity: "asc" },
      take: 10,
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
      count: p.count,
      revenue: Number(p.revenue) || 0,
    })),
    lowStockProducts,
  };
}
