import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Trash2 } from "lucide-react";
import { MaskedInput } from "../common/MaskedInput.js";
import { ProductPicker } from "./ProductPicker.js";
import {
  MARKETPLACES,
  calcIdealPrice,
  calcProductCost,
  formatBRL,
} from "@mimos/shared";
import { DELIVERY_STATUSES } from "@mimos/shared";
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
    gateway: string;
    items: { productId: string; quantity: number }[];
    customerName?: string;
    customerDocument?: string;
    customerState?: string;
    customerGender?: string;
    shopeeUsername?: string;
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
  const [gateway, setGateway] = useState<string>("SHOPEE_CNPJ");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerGender, setCustomerGender] = useState("");
  const [shopeeUsername, setShopeeUsername] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("PENDING");
  const [discount, setDiscount] = useState("");
  const [overrideSubtotal, setOverrideSubtotal] = useState("");
  const [overrideShipping, setOverrideShipping] = useState("");
  const [overrideFees, setOverrideFees] = useState("");
  const [saleDate, setSaleDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  useEffect(() => {
    if (open) {
      setGateway("SHOPEE_CNPJ");
      setItems([{ key: ++nextKey, productId: "", quantity: 1 }]);
      setCustomerName("");
      setCustomerDocument("");
      setCustomerState("");
      setCustomerGender("");
      setShopeeUsername("");
      setDeliveryStatus("PENDING");
      setDiscount("");
      setOverrideSubtotal("");
      setOverrideShipping("");
      setOverrideFees("");
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setSaleDate(now.toISOString().slice(0, 16));
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
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const isPresencial = gateway === "PRESENCIAL";
  const marketplace = isPresencial ? null : (getMarketplace(gateway) ?? MARKETPLACES[gateway]);

  const itemPricing = useMemo(() => {
    return items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product || item.quantity <= 0) {
        return { unitPrice: 0, subtotal: 0, cost: 0, fees: 0, shipping: 0, profit: 0 };
      }
      const costs = buildCosts(product);
      const { total: unitCost } = calcProductCost(costs);

      if (isPresencial || !marketplace) {
        const margin = product.desiredMargin / 100;
        const price = margin < 1 ? unitCost / (1 - margin) : unitCost;
        const salePrice = Math.ceil(price * 100) / 100;
        const profit = salePrice - unitCost;
        return {
          unitPrice: salePrice,
          subtotal: salePrice * item.quantity,
          cost: unitCost * item.quantity,
          fees: 0,
          shipping: product.shippingCost * item.quantity,
          profit: profit * item.quantity,
        };
      }

      const result = calcIdealPrice(costs, product.desiredMargin, marketplace);
      return {
        unitPrice: result.salePrice,
        subtotal: result.salePrice * item.quantity,
        cost: unitCost * item.quantity,
        fees: result.fees.totalFees * item.quantity,
        shipping: product.shippingCost * item.quantity,
        profit: result.profit * item.quantity,
      };
    });
  }, [items, productMap, marketplace, isPresencial]);

  const totals = useMemo(() => {
    let calcPrice = 0;
    let calcCost = 0;
    let calcFees = 0;
    let calcShipping = 0;
    for (const p of itemPricing) {
      calcPrice += p.subtotal;
      calcCost += p.cost;
      calcFees += p.fees;
      calcShipping += p.shipping;
    }
    const totalPrice = overrideSubtotal ? Number(overrideSubtotal) : calcPrice;
    const totalShipping = overrideShipping ? Number(overrideShipping) : calcShipping;
    const totalFees = overrideFees ? Number(overrideFees) : calcFees;
    const discountVal = discount ? Number(discount) : 0;
    const estimatedRevenue = totalPrice - totalFees - discountVal;
    const netProfit = estimatedRevenue - calcCost;
    return {
      totalPrice,
      calcPrice,
      totalCost: calcCost,
      totalFees,
      calcFees,
      totalShipping,
      calcShipping,
      estimatedRevenue,
      netProfit,
    };
  }, [itemPricing, discount, overrideSubtotal, overrideShipping, overrideFees]);

  if (!open) return null;

  const updateItem = (key: number, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const removeItem = (key: number) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { key: ++nextKey, productId: "", quantity: 1 }]);
  };

  const validItems = items.filter((i) => i.productId && i.quantity > 0);
  const canSubmit = validItems.length > 0 && customerState && customerGender && shopeeUsername;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      gateway,
      items: validItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customerName: customerName || undefined,
      customerDocument: customerDocument || undefined,
      customerState,
      customerGender,
      shopeeUsername,
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
          {/* Gateway + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.gateway")} <span className="text-red-400">*</span>
              </label>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="PRESENCIAL">{t("products.inPerson")}</option>
                {allGateways.map((gw) => (
                  <option key={gw.id} value={gw.id}>{gw.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.status")}
              </label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                {DELIVERY_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`deliveryStatus.${s}`)}</option>
                ))}
              </select>
            </div>
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

                      {/* Pricing per item: unit price, quantity, subtotal */}
                      {pricing.unitPrice > 0 && (
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-stroke/30 text-[12px]">
                          <span className="text-text-muted">{formatBRL(pricing.unitPrice)} × {item.quantity}</span>
                          <span className="font-semibold text-text-dark ml-auto">{formatBRL(pricing.subtotal)}</span>
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

          {/* Summary — Shopee style */}
          {validItems.length > 0 && (
            <div className="bg-page-bg rounded-xl border border-stroke/50 overflow-hidden">
              <div className="divide-y divide-stroke/30">
                <div className="flex items-center justify-between px-4 py-1.5">
                  <span className="text-[13px] text-text-secondary">{t("sales.subtotalProducts")}</span>
                  <MaskedInput
                    mask="currency"
                    value={overrideSubtotal}
                    onChange={setOverrideSubtotal}
                    placeholder={formatBRL(totals.calcPrice)}
                    className="w-28 text-right px-2 py-1.5 border border-stroke rounded-lg text-[13px] font-semibold bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-1.5">
                  <span className="text-[13px] text-text-secondary">{t("sales.estimatedShipping")}</span>
                  <MaskedInput
                    mask="currency"
                    value={overrideShipping}
                    onChange={setOverrideShipping}
                    placeholder={formatBRL(totals.calcShipping)}
                    className="w-28 text-right px-2 py-1.5 border border-stroke rounded-lg text-[13px] font-semibold bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-1.5">
                  <span className="text-[13px] text-text-secondary">{t("sales.feesAndCharges")}</span>
                  <MaskedInput
                    mask="currency"
                    value={overrideFees}
                    onChange={setOverrideFees}
                    placeholder={formatBRL(totals.calcFees)}
                    className="w-28 text-right px-2 py-1.5 border border-stroke rounded-lg text-[13px] font-semibold text-red-500 bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                {discount && Number(discount) > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[13px] text-text-secondary">{t("sales.discount")}</span>
                    <span className="text-[13px] font-semibold text-red-500">-{formatBRL(Number(discount))}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[13px] text-text-secondary">{t("sales.estimatedRevenue")}</span>
                  <span className={`text-[14px] font-bold ${totals.estimatedRevenue >= 0 ? "text-primary" : "text-red-500"}`}>
                    {formatBRL(totals.estimatedRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-card-bg">
                  <span className="text-[14px] font-bold text-text-dark">{t("sales.netProfit")}</span>
                  <span className={`text-[18px] font-bold ${totals.netProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {formatBRL(totals.netProfit)}
                  </span>
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
              <MaskedInput
                mask="currency"
                value={discount}
                onChange={setDiscount}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.saleDate")} <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Shopee Username + Gender + State */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.shopeeUsername")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={shopeeUsername}
                onChange={(e) => setShopeeUsername(e.target.value)}
                required
                placeholder="@usuario"
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.customerGender")} <span className="text-red-400">*</span>
              </label>
              <select
                value={customerGender}
                onChange={(e) => setCustomerGender(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="">{t("common.select")}</option>
                <option value="M">{t("sales.genderMale")}</option>
                <option value="F">{t("sales.genderFemale")}</option>
                <option value="O">{t("sales.genderOther")}</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("sales.customerState")} <span className="text-red-400">*</span>
              </label>
              <select
                value={customerState}
                onChange={(e) => setCustomerState(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="">{t("common.select")}</option>
                {BR_STATES.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer name + document */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <MaskedInput
                mask="cpfcnpj"
                value={customerDocument}
                onChange={setCustomerDocument}
                placeholder={t("common.optional")}
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
