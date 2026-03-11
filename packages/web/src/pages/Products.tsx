import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/layout/Header.js";
import { ProductFormDialog } from "../components/products/ProductFormDialog.js";
import { useProductStore } from "../stores/product.store.js";
import { useGatewayStore } from "../stores/gateway.store.js";
import { calcIdealPrice, MARKETPLACES, formatBRL } from "@mimos/shared";
import type { Product } from "@mimos/shared";
import type { Marketplace } from "@mimos/shared";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

interface GatewayPriceInfo {
  id: string;
  label: string;
  marketplace: Marketplace;
}

function getProductPriceForGateway(product: Product, marketplace: Marketplace) {
  const costs = {
    productCost: product.unitPrice,
    packaging: product.packagingCost,
    labor: product.laborCost,
    shipping: product.shippingCost,
    otherCosts: product.otherCosts,
    taxRate: product.taxRate,
  };
  const result = calcIdealPrice(costs, product.desiredMargin, marketplace);
  return { salePrice: result.salePrice, profit: result.profit, margin: result.actualMargin };
}

export default function Products() {
  const { t } = useTranslation();
  const { products, total, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductStore();
  const allGateways = useGatewayStore((s) => s.getAllGateways)();
  const getMarketplaceFn = useGatewayStore((s) => s.getMarketplace);

  const gatewayPriceInfos: GatewayPriceInfo[] = allGateways
    .map((gw) => {
      const mp = getMarketplaceFn(gw.id) ?? MARKETPLACES[gw.id];
      if (!mp) return null;
      return { id: gw.id, label: gw.label, marketplace: mp };
    })
    .filter((v): v is GatewayPriceInfo => v !== null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const loadProducts = useCallback(() => {
    fetchProducts({ search: search || undefined, page });
  }, [fetchProducts, search, page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => { setPage(1); }, [search]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (editProduct) {
      await updateProduct(editProduct.id, data);
    } else {
      await createProduct(data);
    }
    setDialogOpen(false);
    setEditProduct(null);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("products.deleteConfirm"))) return;
    await deleteProduct(id);
    loadProducts();
  };

  return (
    <div>
      <Header title={t("products.title")} />
      <div className="p-4 sm:p-6 animate-fade-in">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6 animate-fade-in-down">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("products.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 border border-stroke rounded-lg text-[14px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all sm:max-w-sm"
            />
          </div>
          <button
            onClick={() => { setEditProduct(null); setDialogOpen(true); }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} /> {t("products.newProduct")}
          </button>
        </div>

        {/* Table */}
        <div className="bg-card-bg border border-stroke rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke bg-page-bg">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("products.name")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("products.stock")}</th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("products.unitPrice")}</th>
                  {gatewayPriceInfos.map((gw) => (
                    <th key={gw.id} className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      {gw.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-stroke/50">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-page-bg rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-text-muted text-[14px]">{t("common.noResults")}</td></tr>
                ) : (
                  products.map((product, index) => {
                    return (
                      <tr key={product.id} className="border-b border-stroke/50 hover:bg-rosa-light/30 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                        <td className="px-4 py-3">
                          <p className="text-[14px] font-semibold text-text-dark">{product.name}</p>
                          {product.supplier && <p className="text-[11px] text-text-muted">{product.supplier}</p>}
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className={`text-[13px] font-semibold ${product.quantity <= 5 ? "text-red-500" : "text-text-dark"}`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="text-right px-3 py-3 text-[13px] font-medium text-text-dark">
                          {formatBRL(product.unitPrice)}
                        </td>
                        {gatewayPriceInfos.map((gw) => {
                          const price = getProductPriceForGateway(product, gw.marketplace);
                          return (
                            <td key={gw.id} className="text-right px-3 py-3">
                              <span className="text-[13px] font-semibold text-text-dark">{formatBRL(price.salePrice)}</span>
                              <span className="block text-[10px] text-text-muted">{price.margin.toFixed(1)}% {t("products.margin").toLowerCase()}</span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-3">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => { setEditProduct(product); setDialogOpen(true); }} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-rosa-light transition-all">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stroke hover:bg-neutral-bg2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("common.previous")}
            </button>
            <span className="text-xs text-text-muted">{page} {t("common.of")} {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stroke hover:bg-neutral-bg2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </div>

      <ProductFormDialog open={dialogOpen} product={editProduct} onClose={() => { setDialogOpen(false); setEditProduct(null); }} onSubmit={handleSubmit} />
    </div>
  );
}
