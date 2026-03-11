import { prisma } from "../lib/prisma.js";

export async function getDashboardData(params: { startDate?: string; endDate?: string; topN?: number }) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const topN = Math.min(Math.max(params.topN ?? 5, 1), 50);

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
    (params.startDate && params.endDate
      ? prisma.$queryRaw`
          SELECT DATE(created_at) as date, COUNT(*)::int as count, SUM(sale_price) as revenue
          FROM sales
          WHERE created_at >= ${new Date(params.startDate)} AND created_at <= ${new Date(params.endDate)}
          GROUP BY DATE(created_at)
          ORDER BY date
        `
      : prisma.$queryRaw`
          SELECT DATE(created_at) as date, COUNT(*)::int as count, SUM(sale_price) as revenue
          FROM sales
          WHERE created_at >= ${startOfMonth}
          GROUP BY DATE(created_at)
          ORDER BY date
        `
    ) as Promise<{ date: string; count: number; revenue: number }[]>,
    prisma.$queryRaw`
      SELECT si.product_id as "productId", COUNT(*)::int as count, SUM(si.sale_price * si.quantity) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= ${startOfMonth}
        AND si.product_id IS NOT NULL
      GROUP BY si.product_id
      ORDER BY revenue DESC
      LIMIT ${topN}
    ` as Promise<{ productId: string; count: number; revenue: number }[]>,
    prisma.product.findMany({
      where: { quantity: { lte: 5 } },
      select: { id: true, name: true, quantity: true, supplier: true },
      orderBy: { quantity: "asc" },
      take: 10,
    }),
  ]);

  const topProductIds = topProducts.map((p) => p.productId).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, imageUrl: true },
  });
  const productMap = new Map(products.map((p) => [p.id, { name: p.name, imageUrl: p.imageUrl }]));

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
    salesByDay: salesByDay.map((d) => ({
      date: d.date,
      count: d.count,
      revenue: Number(d.revenue) || 0,
    })),
    topProducts: topProducts.map((p) => {
      const info = productMap.get(p.productId);
      return {
        productName: info?.name ?? "Produto removido",
        productImageUrl: info?.imageUrl ?? null,
        count: p.count,
        revenue: Number(p.revenue) || 0,
      };
    }),
    lowStockProducts,
  };
}
