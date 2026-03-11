import { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, ShoppingBag } from "lucide-react";
import {
  GATEWAY_LABELS,
  MARKETPLACES,
  calcIdealPrice,
  formatBRL,
} from "@mimos/shared";
import type { Product, GatewayId, ProductCosts } from "@mimos/shared";
import { api } from "../../lib/api.js";

interface ItemRow {
  key: number;
  productId: string;
  quantity: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    gateway: GatewayId;
    items: { productId: string; quantity: number }[];
    customerName?: string;
    customerDocument?: string;
  }) => void;
}

const GATEWAY_IDS: GatewayId[] = ["SHOPEE_CNPJ", "SHOPEE_CPF", "ML_CLASSICO", "ML_PREMIUM"];

let nextKey = 0;

function buildCosts(product: Product): ProductCosts {
  return {
    productCost: product.unitPrice,
    packaging: product.packagingCost,
    labor: product.laborCost,
    shipping: product.shippingCost,
    otherCosts: product.otherCosts,
    taxRate: product.taxRate,
  };
}

export function SaleFormDialog({ open, onClose, onSubmit }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [gateway, setGateway] = useState<GatewayId>("SHOPEE_CNPJ");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");

  useEffect(() => {
    if (open) {
      setGateway("SHOPEE_CNPJ");
      setItems([{ key: ++nextKey, productId: "", quantity: 1 }]);
      setCustomerName("");
      setCustomerDocument("");
      setLoadingProducts(true);
      api
        .get<{ products: Product[]; total: number }>("/products?limit=500")
        .then((data) => setProducts(data.products))
        .catch(() => setProducts([]))
        .finally(() => setLoadingProducts(false));
    }
  }, [open]);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  const marketplace = MARKETPLACES[gateway];

  const itemPricing = useMemo(() => {
    return items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product || item.quantity <= 0) {
        return { unitPrice: 0, subtotal: 0, profit: 0 };
      }
      const costs = buildCosts(product);
      const result = calcIdealPrice(costs, product.desiredMargin, marketplace);
      return {
        unitPrice: result.salePrice,
        subtotal: result.salePrice * item.quantity,
        profit: result.profit * item.quantity,
      };
    });
  }, [items, productMap, marketplace]);

  const totals = useMemo(() => {
    let totalPrice = 0;
    let totalProfit = 0;
    for (const p of itemPricing) {
      totalPrice += p.subtotal;
      totalProfit += p.profit;
    }
    return { totalPrice, totalProfit };
  }, [itemPricing]);

  if (!open) return null;

  const updateItem = (key: number, patch: Partial<ItemRow>) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  };

  const removeItem = (key: number) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { key: ++nextKey, productId: "", quantity: 1 }]);
  };

  const validItems = items.filter((i) => i.productId && i.quantity > 0);
  const canSubmit = validItems.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      gateway,
      items: validItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customerName: customerName || undefined,
      customerDocument: customerDocument || undefined,
    });
  };

  const usedProductIds = new Set(items.map((i) => i.productId).filter(Boolean));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-[18px] font-bold text-text-dark">Nova Venda</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-dark transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Gateway */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              Gateway <span className="text-red-400">*</span>
            </label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value as GatewayId)}
              required
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              {GATEWAY_IDS.map((gid) => (
                <option key={gid} value={gid}>
                  {GATEWAY_LABELS[gid]}
                </option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Itens <span className="text-red-400">*</span>
            </label>

            {loadingProducts ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-12 bg-page-bg rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => {
                  const pricing = itemPricing[index];
                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-2 bg-page-bg rounded-lg p-3 border border-stroke/50 animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Product select */}
                      <div className="flex-1 min-w-0">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(item.key, { productId: e.target.value })}
                          className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        >
                          <option value="">Selecione um produto</option>
                          {products.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              disabled={usedProductIds.has(p.id) && item.productId !== p.id}
                            >
                              {p.name} (est: {p.quantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="w-20">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.key, { quantity: Math.max(1, Number(e.target.value)) })}
                          className="w-full px-2.5 py-2 border border-stroke rounded-lg text-[13px] text-center bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                          placeholder="Qtd"
                        />
                      </div>

                      {/* Unit price (read-only) */}
                      <div className="w-24 text-right">
                        <p className="text-[11px] text-text-muted leading-tight">Unit.</p>
                        <p className="text-[13px] font-semibold text-text-dark">
                          {pricing.unitPrice > 0 ? formatBRL(pricing.unitPrice) : "—"}
                        </p>
                      </div>

                      {/* Subtotal (read-only) */}
                      <div className="w-24 text-right">
                        <p className="text-[11px] text-text-muted leading-tight">Subtotal</p>
                        <p className="text-[13px] font-bold text-text-dark">
                          {pricing.subtotal > 0 ? formatBRL(pricing.subtotal) : "—"}
                        </p>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-text-muted hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={addItem}
              className="mt-2 flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-primary hover:text-primary-hover transition-colors hover:bg-primary/5 rounded-lg"
            >
              <Plus size={14} />
              Adicionar Item
            </button>
          </div>

          {/* Summary bar */}
          {validItems.length > 0 && (
            <div className="flex items-center justify-between bg-page-bg rounded-xl p-4 border border-stroke/50">
              <div className="flex items-center gap-2 text-text-secondary">
                <ShoppingBag size={18} />
                <span className="text-[13px] font-medium">
                  {validItems.length} {validItems.length === 1 ? "item" : "itens"}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[11px] text-text-muted uppercase tracking-wider">Total</p>
                  <p className="text-[16px] font-bold text-text-dark">
                    {formatBRL(totals.totalPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-text-muted uppercase tracking-wider">Lucro Est.</p>
                  <p
                    className={`text-[16px] font-bold ${totals.totalProfit >= 0 ? "text-green-600" : "text-red-500"}`}
                  >
                    {formatBRL(totals.totalProfit)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                CPF/CNPJ do Cliente
              </label>
              <input
                type="text"
                value={customerDocument}
                onChange={(e) => setCustomerDocument(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
