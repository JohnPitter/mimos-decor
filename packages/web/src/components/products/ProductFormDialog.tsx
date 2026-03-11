import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Product } from "@mimos/shared";

interface Props {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

const FIELDS = [
  { name: "name", label: "Nome do Produto", type: "text", required: true },
  { name: "unitPrice", label: "Valor Unitario (R$)", type: "number", required: true },
  { name: "quantity", label: "Quantidade", type: "number", required: true },
  { name: "shippingCost", label: "Valor do Frete (R$)", type: "number", required: true },
  { name: "desiredMargin", label: "Margem Desejada (%)", type: "number", required: true },
  { name: "supplier", label: "Fornecedor", type: "text", required: false },
  { name: "taxRate", label: "Imposto (%)", type: "number", required: false },
  { name: "packagingCost", label: "Custo Embalagem (R$)", type: "number", required: false },
  { name: "laborCost", label: "Custo Mao de Obra (R$)", type: "number", required: false },
  { name: "otherCosts", label: "Outros Custos (R$)", type: "number", required: false },
];

export function ProductFormDialog({ open, product, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Record<string, string | number | null>>({});

  useEffect(() => {
    if (product) {
      setForm({ ...product });
    } else {
      setForm({ desiredMargin: 20, taxRate: 0, packagingCost: 0, laborCost: 0, otherCosts: 0, quantity: 0, shippingCost: 0 });
    }
  }, [product, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    for (const field of FIELDS) {
      const val = form[field.name];
      data[field.name] = field.type === "number" ? Number(val || 0) : val || (field.required ? "" : undefined);
    }
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-[18px] font-bold text-text-dark">{product ? "Editar Produto" : "Novo Produto"}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {FIELDS.map((field) => (
            <div key={field.name}>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </label>
              <input
                type={field.type}
                value={form[field.name] ?? ""}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                step={field.type === "number" ? "0.01" : undefined}
                required={field.required}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99]">
              {product ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
