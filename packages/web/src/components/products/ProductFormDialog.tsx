import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { X, Upload, ImageIcon } from "lucide-react";
import { api } from "../../lib/api.js";
import type { Product } from "@mimos/shared";

interface Props {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<Product | void>;
}

export function ProductFormDialog({ open, product, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Record<string, string | number | null>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const FIELDS = [
    { name: "name", labelKey: "products.name", type: "text", required: true },
    { name: "unitPrice", labelKey: "products.unitPrice", type: "number", required: true },
    { name: "quantity", labelKey: "products.quantity", type: "number", required: true },
    { name: "shippingCost", labelKey: "products.shippingCost", type: "number", required: true },
    { name: "desiredMargin", labelKey: "products.desiredMargin", type: "number", required: true },
    { name: "supplier", labelKey: "products.supplier", type: "text", required: false },
    { name: "taxRate", labelKey: "products.taxRate", type: "number", required: false },
    { name: "packagingCost", labelKey: "products.packagingCost", type: "number", required: false },
    { name: "laborCost", labelKey: "products.laborCost", type: "number", required: false },
    { name: "otherCosts", labelKey: "products.otherCosts", type: "number", required: false },
  ];

  useEffect(() => {
    if (product) {
      setForm({ ...product });
      setImagePreview(product.imageUrl ?? null);
      setPendingFile(null);
    } else {
      setForm({ desiredMargin: 20, taxRate: 0, packagingCost: 0, laborCost: 0, otherCosts: 0, quantity: 0, shippingCost: 0 });
      setImagePreview(null);
      setPendingFile(null);
    }
  }, [product, open]);

  if (!open) return null;

  const uploadImage = async (productId: string, file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.upload<{ imageUrl: string }>(`/products/${productId}/image`, fd);
      setImagePreview(res.imageUrl);
      toast.success(t("products.imageUploaded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("products.imageUploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    if (product) {
      // Editing: upload right away
      await uploadImage(product.id, file);
      URL.revokeObjectURL(localUrl);
    } else {
      // Creating: save file for after submit
      setPendingFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const data: Record<string, unknown> = {};
      for (const field of FIELDS) {
        const val = form[field.name];
        data[field.name] = field.type === "number" ? Number(val || 0) : val || (field.required ? "" : undefined);
      }
      const result = await onSubmit(data);

      // If we just created a product and have a pending image, upload it
      if (result && pendingFile) {
        await uploadImage(result.id, pendingFile);
        setPendingFile(null);
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in mx-4 sm:mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-[18px] font-bold text-text-dark">{product ? t("products.editProduct") : t("products.createProduct")}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image upload — always visible */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border border-stroke bg-page-bg flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={24} className="text-text-muted" />
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 border border-stroke rounded-lg text-[13px] font-medium text-text-secondary hover:bg-page-bg transition-colors disabled:opacity-50"
              >
                <Upload size={14} />
                {uploading ? t("common.loading") : imagePreview ? t("products.changeImage") : t("products.uploadImage")}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          {FIELDS.map((field) => (
            <div key={field.name}>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t(field.labelKey)} {field.required && <span className="text-red-400">*</span>}
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
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={uploading || submitting} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
              {uploading || submitting ? t("common.loading") : product ? t("common.save") : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
