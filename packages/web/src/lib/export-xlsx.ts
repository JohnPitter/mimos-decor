import * as XLSX from "xlsx";
import { formatBRL } from "@mimos/shared";
import type { Sale, Product, SaleDashboard } from "@mimos/shared";

function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function autoWidth(ws: XLSX.WorkSheet, data: unknown[][]) {
  const colWidths: number[] = [];
  for (const row of data) {
    row.forEach((cell, i) => {
      const len = String(cell ?? "").length;
      colWidths[i] = Math.max(colWidths[i] ?? 0, len);
    });
  }
  ws["!cols"] = colWidths.map((w) => ({ wch: Math.min(w + 2, 40) }));
}

function applyHeaderStyle(ws: XLSX.WorkSheet, colCount: number, headerRow: number, primaryColor: string) {
  const rgb = hexToRGB(primaryColor);
  for (let c = 0; c < colCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRow, c });
    if (!ws[addr]) continue;
    ws[addr].s = {
      fill: { fgColor: { rgb: `${rgb.r.toString(16).padStart(2, "0")}${rgb.g.toString(16).padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`.toUpperCase() } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
      },
    };
  }
}

function applyAlternatingRows(ws: XLSX.WorkSheet, startRow: number, endRow: number, colCount: number) {
  for (let r = startRow; r <= endRow; r++) {
    const isEven = (r - startRow) % 2 === 0;
    for (let c = 0; c < colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { v: "", t: "s" };
      ws[addr].s = {
        ...(ws[addr].s ?? {}),
        fill: isEven ? { fgColor: { rgb: "F9F9F9" } } : undefined,
        border: {
          bottom: { style: "thin", color: { rgb: "EEEEEE" } },
        },
      };
    }
  }
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", bookSST: false });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface ExportOptions {
  primaryColor: string;
  title: string;
}

export function exportSalesXlsx(
  sales: Sale[],
  getGatewayLabel: (id: string) => string,
  tDeliveryStatus: (status: string) => string,
  opts: ExportOptions,
) {
  const headers = ["Produto", "Cliente", "Usuário Shopee", "Sexo", "Estado", "Gateway", "Qtd.", "Valor Venda", "Desconto", "Custo", "Taxas", "Lucro", "Status", "Data da Venda"];
  const genderLabel = (g: string | null) => g === "M" ? "Masculino" : g === "F" ? "Feminino" : g === "O" ? "Outros" : "—";
  const rows = sales.map((s) => [
    s.items.map((i) => i.productName).join(", "),
    s.customerName ?? "—",
    s.shopeeUsername ?? "—",
    genderLabel(s.customerGender),
    s.customerState ?? "—",
    getGatewayLabel(s.gateway),
    s.items.reduce((sum, i) => sum + i.quantity, 0),
    formatBRL(s.salePrice),
    formatBRL(s.discount ?? 0),
    formatBRL(s.totalCost),
    formatBRL(s.totalFees),
    formatBRL(s.profit),
    tDeliveryStatus(s.deliveryStatus),
    new Date(s.saleDate ?? s.createdAt).toLocaleDateString("pt-BR"),
  ]);

  const titleRow = [opts.title, "", "", "", "", "", "", "", "", "", "", "", "", new Date().toLocaleDateString("pt-BR")];
  const data = [titleRow, headers, ...rows];

  const ws = XLSX.utils.aoa_to_sheet(data);
  autoWidth(ws, data);

  // Merge title row
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }];

  // Style title
  const titleAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleAddr]) {
    ws[titleAddr].s = { font: { bold: true, sz: 16, color: { rgb: "333333" } }, alignment: { horizontal: "left" } };
  }

  applyHeaderStyle(ws, headers.length, 1, opts.primaryColor);
  applyAlternatingRows(ws, 2, data.length - 1, headers.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vendas");
  downloadWorkbook(wb, `vendas_${Date.now()}.xlsx`);
}

export function exportProductsXlsx(
  products: Product[],
  opts: ExportOptions,
) {
  const headers = ["Nome", "Fornecedor", "Estoque", "Preço Unit.", "Frete", "Margem (%)", "Embalagem", "Mão de Obra", "Outros Custos", "Impostos (%)"];
  const rows = products.map((p) => [
    p.name,
    p.supplier ?? "—",
    p.quantity,
    formatBRL(p.unitPrice),
    formatBRL(p.shippingCost),
    p.desiredMargin,
    formatBRL(p.packagingCost),
    formatBRL(p.laborCost),
    formatBRL(p.otherCosts),
    p.taxRate,
  ]);

  const titleRow = [opts.title, "", "", "", "", "", "", "", "", new Date().toLocaleDateString("pt-BR")];
  const data = [titleRow, headers, ...rows];

  const ws = XLSX.utils.aoa_to_sheet(data);
  autoWidth(ws, data);
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

  const titleAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleAddr]) {
    ws[titleAddr].s = { font: { bold: true, sz: 16, color: { rgb: "333333" } }, alignment: { horizontal: "left" } };
  }

  applyHeaderStyle(ws, headers.length, 1, opts.primaryColor);
  applyAlternatingRows(ws, 2, data.length - 1, headers.length);

  // Highlight low stock
  for (let r = 2; r < data.length; r++) {
    const stockAddr = XLSX.utils.encode_cell({ r, c: 2 });
    if (ws[stockAddr] && Number(products[r - 2]?.quantity) <= 5) {
      ws[stockAddr].s = { ...(ws[stockAddr].s ?? {}), font: { bold: true, color: { rgb: "DC2626" } } };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  downloadWorkbook(wb, `produtos_${Date.now()}.xlsx`);
}

export function exportDashboardXlsx(
  dashboard: SaleDashboard,
  getGatewayLabel: (id: string) => string,
  opts: ExportOptions,
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumo (KPIs)
  const kpiData = [
    [opts.title, "", new Date().toLocaleDateString("pt-BR")],
    [],
    ["Indicador", "Valor"],
    ["Vendas Hoje", dashboard.totalSalesToday],
    ["Vendas no Mês", dashboard.totalSalesMonth],
    ["Faturamento Mês", formatBRL(dashboard.revenueMonth)],
    ["Lucro Mês", formatBRL(dashboard.profitMonth)],
    ["Ticket Médio", formatBRL(dashboard.averageTicket)],
  ];
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
  autoWidth(wsKpi, kpiData);
  wsKpi["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  applyHeaderStyle(wsKpi, 2, 2, opts.primaryColor);
  XLSX.utils.book_append_sheet(wb, wsKpi, "Resumo");

  // Sheet 2: Vendas por Dia
  const dayHeaders = ["Data", "Quantidade", "Faturamento"];
  const dayRows = dashboard.salesByDay.map((d) => [
    new Date(d.date).toLocaleDateString("pt-BR"),
    d.count,
    formatBRL(d.revenue),
  ]);
  const dayData = [dayHeaders, ...dayRows];
  const wsDay = XLSX.utils.aoa_to_sheet(dayData);
  autoWidth(wsDay, dayData);
  applyHeaderStyle(wsDay, 3, 0, opts.primaryColor);
  applyAlternatingRows(wsDay, 1, dayData.length - 1, 3);
  XLSX.utils.book_append_sheet(wb, wsDay, "Vendas por Dia");

  // Sheet 3: Top Produtos
  const prodHeaders = ["Produto", "Vendas", "Faturamento"];
  const prodRows = dashboard.topProducts.map((p) => [
    p.productName,
    p.count,
    formatBRL(p.revenue),
  ]);
  const prodData = [prodHeaders, ...prodRows];
  const wsProd = XLSX.utils.aoa_to_sheet(prodData);
  autoWidth(wsProd, prodData);
  applyHeaderStyle(wsProd, 3, 0, opts.primaryColor);
  applyAlternatingRows(wsProd, 1, prodData.length - 1, 3);
  XLSX.utils.book_append_sheet(wb, wsProd, "Top Produtos");

  // Sheet 4: Vendas por Gateway
  const gwHeaders = ["Gateway", "Vendas", "Faturamento"];
  const gwRows = dashboard.salesByGateway.map((g) => [
    getGatewayLabel(g.gateway),
    g.count,
    formatBRL(g.revenue),
  ]);
  const gwData = [gwHeaders, ...gwRows];
  const wsGw = XLSX.utils.aoa_to_sheet(gwData);
  autoWidth(wsGw, gwData);
  applyHeaderStyle(wsGw, 3, 0, opts.primaryColor);
  applyAlternatingRows(wsGw, 1, gwData.length - 1, 3);
  XLSX.utils.book_append_sheet(wb, wsGw, "Vendas por Gateway");

  downloadWorkbook(wb, `dashboard_${Date.now()}.xlsx`);
}
