import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBRL } from "@mimos/shared";
import type { Sale, Product, SaleDashboard } from "@mimos/shared";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function addHeader(doc: jsPDF, title: string, primaryColor: string) {
  const [r, g, b] = hexToRgb(primaryColor);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageWidth, 22, "F");

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 14);

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("pt-BR");
  doc.text(dateStr, pageWidth - 14 - doc.getTextWidth(dateStr), 14);

  // Brand line
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Mimos Decor", 14, 28);

  doc.setTextColor(0, 0, 0);
}

function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}

interface ExportOptions {
  primaryColor: string;
  title: string;
}

export function exportSalesPdf(
  sales: Sale[],
  getGatewayLabel: (id: string) => string,
  tDeliveryStatus: (status: string) => string,
  opts: ExportOptions,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  addHeader(doc, opts.title, opts.primaryColor);

  const head = [["Produto", "Cliente", "Gateway", "Qtd.", "Valor Venda", "Custo", "Taxas", "Lucro", "Status", "Data"]];
  const body = sales.map((s) => [
    s.items.map((i) => i.productName).join(", "),
    s.customerName ?? "—",
    getGatewayLabel(s.gateway),
    String(s.items.reduce((sum, i) => sum + i.quantity, 0)),
    formatBRL(s.salePrice),
    formatBRL(s.totalCost),
    formatBRL(s.totalFees),
    formatBRL(s.profit),
    tDeliveryStatus(s.deliveryStatus),
    new Date(s.createdAt).toLocaleDateString("pt-BR"),
  ]);

  const [r, g, b] = hexToRgb(opts.primaryColor);

  autoTable(doc, {
    startY: 34,
    head,
    body,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    columnStyles: {
      7: { cellWidth: 22, halign: "right" },
      4: { cellWidth: 24, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 18, halign: "right" },
    },
  });

  downloadPdf(doc, `vendas_${Date.now()}.pdf`);
}

export function exportProductsPdf(
  products: Product[],
  opts: ExportOptions,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  addHeader(doc, opts.title, opts.primaryColor);

  const head = [["Nome", "Fornecedor", "Estoque", "Preço Unit.", "Frete", "Margem (%)", "Embalagem", "Mão de Obra", "Outros", "Impostos (%)"]];
  const body = products.map((p) => [
    p.name,
    p.supplier ?? "—",
    String(p.quantity),
    formatBRL(p.unitPrice),
    formatBRL(p.shippingCost),
    String(p.desiredMargin),
    formatBRL(p.packagingCost),
    formatBRL(p.laborCost),
    formatBRL(p.otherCosts),
    String(p.taxRate),
  ]);

  const [r, g, b] = hexToRgb(opts.primaryColor);

  autoTable(doc, {
    startY: 34,
    head,
    body,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    didParseCell: (data) => {
      // Red text for low stock
      if (data.section === "body" && data.column.index === 2) {
        const qty = Number(data.cell.raw);
        if (qty <= 5) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  downloadPdf(doc, `produtos_${Date.now()}.pdf`);
}

export function exportDashboardPdf(
  dashboard: SaleDashboard,
  getGatewayLabel: (id: string) => string,
  opts: ExportOptions,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  addHeader(doc, opts.title, opts.primaryColor);

  const [r, g, b] = hexToRgb(opts.primaryColor);
  const pageWidth = doc.internal.pageSize.getWidth();

  // KPI Cards
  const kpis = [
    { label: "Vendas Hoje", value: String(dashboard.totalSalesToday) },
    { label: "Vendas no Mês", value: String(dashboard.totalSalesMonth) },
    { label: "Faturamento Mês", value: formatBRL(dashboard.revenueMonth) },
    { label: "Lucro Mês", value: formatBRL(dashboard.profitMonth) },
    { label: "Ticket Médio", value: formatBRL(dashboard.averageTicket) },
  ];

  const cardWidth = (pageWidth - 28 - (kpis.length - 1) * 4) / kpis.length;
  let x = 14;
  const y = 34;

  kpis.forEach((kpi) => {
    // Card background
    doc.setFillColor(249, 249, 249);
    doc.roundedRect(x, y, cardWidth, 22, 2, 2, "F");

    // Card border
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(x, y, cardWidth, 22, 2, 2, "S");

    // Label
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, x + 4, y + 8);

    // Value
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x + 4, y + 18);

    x += cardWidth + 4;
  });

  let currentY = y + 30;

  // Sales by Day table
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Vendas por Dia", 14, currentY);
  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    head: [["Data", "Quantidade", "Faturamento"]],
    body: dashboard.salesByDay.map((d) => [
      new Date(d.date).toLocaleDateString("pt-BR"),
      String(d.count),
      formatBRL(d.revenue),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    margin: { left: 14, right: pageWidth / 2 + 4 },
    tableWidth: pageWidth / 2 - 18,
  });

  // Top Products table (right side)
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Top Produtos", pageWidth / 2 + 4, currentY - 2);

  autoTable(doc, {
    startY: currentY,
    head: [["Produto", "Vendas", "Faturamento"]],
    body: dashboard.topProducts.map((p) => [
      p.productName,
      String(p.count),
      formatBRL(p.revenue),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    margin: { left: pageWidth / 2 + 4, right: 14 },
    tableWidth: pageWidth / 2 - 18,
  });

  // Sales by Gateway table (new page if needed)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastTableY = (doc as any).lastAutoTable?.finalY ?? currentY + 60;
  currentY = lastTableY + 10;

  if (currentY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Vendas por Gateway", 14, currentY);
  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    head: [["Gateway", "Vendas", "Faturamento"]],
    body: dashboard.salesByGateway.map((g) => [
      getGatewayLabel(g.gateway),
      String(g.count),
      formatBRL(g.revenue),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    tableWidth: pageWidth / 2 - 18,
  });

  downloadPdf(doc, `dashboard_${Date.now()}.pdf`);
}
