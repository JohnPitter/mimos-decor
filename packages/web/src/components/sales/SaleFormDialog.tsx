import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Trash2, ShoppingBag } from "lucide-react";
import { ProductPicker } from "./ProductPicker.js";
import {
  MARKETPLACES,
  calcIdealPrice,
  calcProductCost,
  formatBRL,
} from "@mimos/shared";
import type { Product, GatewayId, ProductCosts } from "@mimos/shared";
import { api } from "../../lib/api.js";
import { useGatewayStore } from "../../stores/gateway.store.js";

const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

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
    customerState?: string;
    deliveryStatus?: string;
    discount?: number;
    saleDate?: string;
  }) => void;
}

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
  const { t } = useTranslation();
  const allGateways = useGatewayStore((s) => s.getAllGateways)();
  const getMarketplace = useGatewayStore((s) => s.getMarketplace);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [gateway, setGateway] = useState<GatewayId>("SHOPEE_CNPJ");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("PENDING");
  const [discount, setDiscount] = useState("");
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open) {
      setGateway("SHOPEE_CNPJ");
      setItems([{ key: ++nextKey, productId: "", quantity: 1 }]);
      setCustomerName("");
      setCustomerDocument("");
      setCustomerState("");
      setDeliveryStatus("PENDING");
      setDiscount("");
      setSaleDate(new Date().toISOString().slice(0, 10));
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

  const marketplace = getMarketplace(gateway) ?? MARKETPLACES[gateway];

  const itemPricing = useMemo(() => {
    if (!marketplace) return items.map(() => ({ unitPrice: 0, subtotal: 0, cost: 0, fees: 0, profit: 0 }));
    return items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product || item.quantity <= 0) {
        return { unitPrice: 0, subtotal: 0, cost: 0, fees: 0, profit: 0 };
      }
      const costs = buildCosts(product);
      const result = calcIdealPrice(costs, product.desiredMargin, marketplace);
      const { total: unitCost } = calcProductCost(costs);
      return {
        unitPrice: result.salePrice,
        subtotal: result.salePrice * item.quantity,
        cost: unitCost * item.quantity,
        fees: result.fees.totalFees * item.quantity,
        profit: result.profit * item.quantity,
      };
    });
  }, [items, productMap, marketplace]);

  const totals = useMemo(() => {
    let totalPrice = 0;
    let totalCost = 0;
    let totalFees = 0;
    let totalProfit = 0;
    for (const p of itemPricing) {
      totalPrice += p.subtotal;
      totalCost += p.cost;
      totalFees += p.fees;
      totalProfit += p.profit;
    }
    const discountVal = discount ? Number(discount) : 0;
    return {
      totalPrice,
      totalCost,
      totalFees,
      totalProfit: totalProfit - discountVal,
      netRevenue: totalPrice - totalFees - discountVal,
    };
  }, [itemPricing, discount]);

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
      customerState: customerState || undefined,
      deliveryStatus: deliveryStatus || undefined,
      discount: discount ? Number(discount) : undefined,
      saleDate: saleDate || undefined,
    });
  };

  const usedProductIds = new Set(items.map((i) => i.productId).filter(Boolean));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in mx-4 sm:mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-[18px] font-bold text-text-dark">{t("sales.newSale")}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Gateway */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("sales.gateway")} <span className="text-red-400">*</span>
            </label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value as GatewayId)}
              required
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              {allGateways.map((gw) => (
                <option key={gw.id} value={gw.id}>{gw.label}</option>
              ))}
            </select>
          </div>

          {/* Delivery Status */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("sales.status")}
            </label>
            <select
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              {(["PENDING", "PREPARING", "IN_TRANSIT", "DELIVERED", "RETURNED", "CANCELLED"] as const).map((s) => (
                <option key={s} value={s}>{t(`deliveryStatus.${s}`)}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              {t("sales.items")} <span className="text-red-400">*</span>
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
                      className="bg-page-bg rounded-lg p-3 border border-stroke/50 animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <ProductPicker
                            products={products}
                            value={item.productId}
                            onChange={(productId) => updateItem(item.key, { productId })}
                            disabledIds={usedProductIds}
                          />
                        </div>
                        <div className="w-16 sm:w-20">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.key, { quantity: Math.max(1, Number(e.target.value)) })}
                            className="w-full px-2 sm:px-2.5 py-2 border border-stroke rounded-lg text-[13px] text-center bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            placeholder="Qtd"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          disabled={items.length <= 1}
                          className="p-1.5 text-text-muted hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {pricing.unitPrice > 0 && (
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-stroke/30">
                          <div className="text-left">
                            <p className="text-[10px] text-text-muted leading-tight">Unit.</p>
                            <p className="text-[12px] sm:text-[13px] font-semibold text-text-dark">
                              {formatBRL(pricing.unitPrice)}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-text-muted leading-tight">Subtotal</p>
                            <p className="text-[12px] sm:text-[13px] font-bold text-text-dark">
                              {formatBRL(pricing.subtotal)}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-text-muted leading-tight">{t("sales.totalFees")}</p>
                            <p className="text-[12px] sm:text-[13px] font-medium text-red-500">
                              -{formatBRL(pricing.fees)}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-text-muted leading-tight">{t("sales.profit")}</p>
                            <p className={`text-[12px] sm:text-[13px] font-bold ${pricing.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                              {formatBRL(pricing.profit)}
                            </p>
                          </div>
                        </div>
                      )}
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
              {t("sales.addItem")}
            </button>
          </div>

          {/* Summary bar */}
          {validItems.length > 0 && (
            <div className="bg-page-bg rounded-xl p-4 border border-stroke/50 space-y-3">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <ShoppingBag size={18} />
                <span className="text-[13px] font-medium">
                  {validItems.length} {t("common.items")}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{t("sales.salePrice")}</p>
                  <p className="text-[15px] font-bold text-text-dark">{formatBRL(totals.totalPrice)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{t("sales.totalCost")}</p>
                  <p className="text-[15px] font-bold text-text-dark">{formatBRL(totals.totalCost)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{t("sales.totalFees")}</p>
                  <p className="text-[15px] font-bold text-red-500">-{formatBRL(totals.totalFees)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{t("sales.profit")}</p>
                  <p className={`text-[15px] font-bold ${totals.totalProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {formatBRL(totals.totalProfit)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Discount + Sale Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.discount")}
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                step="0.01"
                min="0"
                placeholder="R$ 0,00"
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.saleDate")} <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Customer fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.customerName")}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t("common.optional")}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.customerDocument")}
              </label>
              <input
                type="text"
                value={customerDocument}
                onChange={(e) => setCustomerDocument(e.target.value)}
                placeholder={t("common.optional")}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.customerState")}
              </label>
              <select
                value={customerState}
                onChange={(e) => setCustomerState(e.target.value)}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="">{t("common.optional")}</option>
                {BR_STATES.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("sales.newSale")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
