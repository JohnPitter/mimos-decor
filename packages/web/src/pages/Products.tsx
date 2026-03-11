import { useEffect, useState, useCallback } from "react";
import { Header } from "../components/layout/Header.js";
import { ProductFormDialog } from "../components/products/ProductFormDialog.js";
import { useProductStore } from "../stores/product.store.js";
import { calcIdealPrice, MARKETPLACES, formatBRL, GATEWAY_LABELS } from "@mimos/shared";
import type { Product, GatewayId } from "@mimos/shared";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

const GATEWAY_IDS: GatewayId[] = ["SHOPEE_CPF", "SHOPEE_CNPJ", "ML_CLASSICO", "ML_PREMIUM"];

function getProductPrices(product: Product) {
  const costs = {
    productCost: product.unitPrice,
    packaging: product.packagingCost,
    labor: product.laborCost,
    shipping: product.shippingCost,
    otherCosts: product.otherCosts,
    taxRate: product.taxRate,
  };
  const prices: Record<string, { salePrice: number; profit: number; margin: number }> = {};
  for (const gid of GATEWAY_IDS) {
    const mp = MARKETPLACES[gid];
    const result = calcIdealPrice(costs, product.desiredMargin, mp);
    prices[gid] = { salePrice: result.salePrice, profit: result.profit, margin: result.actualMargin };
  }
  return prices;
}

export default function Products() {
  const { products, total, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductStore();
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
    if (!confirm("Deseja excluir este produto?")) return;
    await deleteProduct(id);
    loadProducts();
  };

  return (
    <div>
      <Header title="Produtos" />
      <div className="p-6">
        {/* Actions bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-9 pr-4 py-2.5 border border-stroke rounded-lg text-[14px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button
            onClick={() => { setEditProduct(null); setDialogOpen(true); }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>

        {/* Table */}
        <div className="bg-card-bg border border-stroke rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke bg-page-bg">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Produto</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Qtd</th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Unit.</th>
                  {GATEWAY_IDS.map((gid) => (
                    <th key={gid} className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      {GATEWAY_LABELS[gid]}
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
                  <tr><td colSpan={8} className="text-center py-12 text-text-muted text-[14px]">Nenhum produto encontrado</td></tr>
                ) : (
                  products.map((product) => {
                    const prices = getProductPrices(product);
                    return (
                      <tr key={product.id} className="border-b border-stroke/50 hover:bg-rosa-light/30 transition-colors">
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
                        {GATEWAY_IDS.map((gid) => (
                          <td key={gid} className="text-right px-3 py-3">
                            <span className="text-[13px] font-semibold text-text-dark">{formatBRL(prices[gid].salePrice)}</span>
                            <span className="block text-[10px] text-text-muted">{prices[gid].margin.toFixed(1)}% margem</span>
                          </td>
                        ))}
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
              Anterior
            </button>
            <span className="text-xs text-text-muted">{page} de {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stroke hover:bg-neutral-bg2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próximo
            </button>
          </div>
        )}
      </div>

      <ProductFormDialog open={dialogOpen} product={editProduct} onClose={() => { setDialogOpen(false); setEditProduct(null); }} onSubmit={handleSubmit} />
    </div>
  );
}
