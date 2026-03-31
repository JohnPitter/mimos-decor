import { prisma } from "../lib/prisma.js";
import { getConfiguredTimezone, getStartOfDayUTC, getStartOfMonthUTC } from "../lib/timezone.js";

const NOT_CANCELLED = { deliveryStatus: { not: "CANCELLED" as const } };

export async function getDashboardData(params: { startDate?: string; endDate?: string; topN?: number }) {
  const tz = await getConfiguredTimezone();
  const startOfDay = getStartOfDayUTC(tz);
  const startOfMonth = getStartOfMonthUTC(tz);
  const topN = Math.min(Math.max(params.topN ?? 5, 1), 50);

  const dateFilter = params.startDate || params.endDate
    ? {
        saleDate: {
          ...(params.startDate && { gte: new Date(params.startDate) }),
          ...(params.endDate && { lte: new Date(params.endDate) }),
        },
      }
    : {};

  const DELIVERED_ONLY = { deliveryStatus: "DELIVERED" as const };

  const [todaySales, monthSales, deliveredProfit, salesByGateway, salesByDay, topProducts, lowStockProducts, productStock] = await Promise.all([
    prisma.sale.aggregate({
      where: { saleDate: { gte: startOfDay }, ...NOT_CANCELLED },
      _count: true,
      _sum: { salePrice: true, profit: true },
    }),
    prisma.sale.aggregate({
      where: { saleDate: { gte: startOfMonth }, ...NOT_CANCELLED, ...dateFilter },
      _count: true,
      _sum: { salePrice: true, profit: true, netRevenue: true },
    }),
    prisma.sale.aggregate({
      where: { saleDate: { gte: startOfMonth }, ...DELIVERED_ONLY, ...dateFilter },
      _sum: { profit: true },
    }),
    prisma.sale.groupBy({
      by: ["gateway"],
      where: { saleDate: { gte: startOfMonth }, ...NOT_CANCELLED, ...dateFilter },
      _count: true,
      _sum: { salePrice: true },
    }),
    (params.startDate && params.endDate
      ? prisma.$queryRaw`
          SELECT DATE(sale_date) as date, COUNT(*)::int as count, SUM(sale_price) as revenue
          FROM sales
          WHERE sale_date >= ${new Date(params.startDate)} AND sale_date <= ${new Date(params.endDate)}
            AND delivery_status != 'CANCELLED'
          GROUP BY DATE(sale_date)
          ORDER BY date
        `
      : prisma.$queryRaw`
          SELECT DATE(sale_date) as date, COUNT(*)::int as count, SUM(sale_price) as revenue
          FROM sales
          WHERE sale_date >= ${startOfMonth}
            AND delivery_status != 'CANCELLED'
          GROUP BY DATE(sale_date)
          ORDER BY date
        `
    ) as Promise<{ date: string; count: number; revenue: number }[]>,
    prisma.$queryRaw`
      SELECT si.product_id as "productId", COUNT(*)::int as count, SUM(si.sale_price * si.quantity) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date >= ${startOfMonth}
        AND s.delivery_status != 'CANCELLED'
        AND si.product_id IS NOT NULL
      GROUP BY si.product_id
      ORDER BY revenue DESC
      LIMIT ${topN}
    ` as Promise<{ productId: string; count: number; revenue: number }[]>,
    prisma.product.findMany({
      where: { quantity: { lte: 5 } },
      select: { id: true, name: true, quantity: true, supplier: true, imageUrl: true },
      orderBy: { quantity: "asc" },
      take: 10,
    }),
    prisma.product.findMany({
      select: { name: true, quantity: true, imageUrl: true },
      orderBy: { quantity: "asc" },
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
    netRevenueMonth: monthSales._sum.netRevenue ?? 0,
    profitMonth: deliveredProfit._sum.profit ?? 0,
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
    productStock: productStock.map((p) => ({
      name: p.name,
      quantity: p.quantity,
      imageUrl: p.imageUrl,
    })),
  };
}
