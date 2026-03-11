import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { GATEWAY_LABELS } from "@mimos/shared";
import type { Product, GatewayId } from "@mimos/shared";
import { api } from "../../lib/api.js";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    productId: string;
    quantity: number;
    gateway: GatewayId;
    salePrice: number;
    customerName?: string;
    customerDocument?: string;
  }) => void;
}

const GATEWAY_IDS: GatewayId[] = ["SHOPEE_CNPJ", "SHOPEE_CPF", "ML_CLASSICO", "ML_PREMIUM"];

export function SaleFormDialog({ open, onClose, onSubmit }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [gateway, setGateway] = useState<GatewayId>("SHOPEE_CNPJ");
  const [salePrice, setSalePrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");

  useEffect(() => {
    if (open) {
      setProductId("");
      setQuantity(1);
      setGateway("SHOPEE_CNPJ");
      setSalePrice("");
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

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      productId,
      quantity,
      gateway,
      salePrice: Number(salePrice),
      customerName: customerName || undefined,
      customerDocument: customerDocument || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Select */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              Produto <span className="text-red-400">*</span>
            </label>
            {loadingProducts ? (
              <div className="h-10 bg-page-bg rounded-lg animate-pulse" />
            ) : (
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="">Selecione um produto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (estoque: {p.quantity})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              Quantidade <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

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

          {/* Sale Price */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              Valor de Venda (R$) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Customer Name */}
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

          {/* Customer Document */}
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
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Criar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
