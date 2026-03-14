import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type { FinanceEntry, FinanceCategory } from "@mimos/shared";

interface Props {
  open: boolean;
  entry?: FinanceEntry | null;
  categories: FinanceCategory[];
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

export function FinanceFormDialog({ open, entry, categories, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState<"PAYABLE" | "RECEIVABLE">("PAYABLE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringMonths, setRecurringMonths] = useState("2");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (entry) {
      setType(entry.type);
      setTitle(entry.title);
      setDescription(entry.description ?? "");
      setAmount(String(entry.amount));
      setCategoryId(entry.categoryId);
      setDueDate(entry.dueDate.slice(0, 10));
      setIsRecurring(false);
      setRecurringMonths("2");
    } else {
      setType("PAYABLE");
      setTitle("");
      setDescription("");
      setAmount("");
      setCategoryId("");
      setDueDate("");
      setIsRecurring(false);
      setRecurringMonths("2");
    }
  }, [entry, open]);

  if (!open) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        title,
        description: description || undefined,
        amount: Number(amount),
        categoryId,
        dueDate,
        isRecurring: !entry && isRecurring,
        recurringMonths: !entry && isRecurring ? Number(recurringMonths) : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in mx-4 sm:mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-[18px] font-bold text-text-dark">
            {entry ? t("finances.editEntry") : t("finances.newEntry")}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type toggle */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
              {t("finances.type")}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setType("PAYABLE"); setCategoryId(""); }}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                  type === "PAYABLE"
                    ? "bg-red-50 text-red-600 border-2 border-red-200"
                    : "bg-page-bg text-text-muted border border-stroke hover:bg-rosa-light/30"
                }`}
              >
                {t("finances.payable")}
              </button>
              <button
                type="button"
                onClick={() => { setType("RECEIVABLE"); setCategoryId(""); }}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                  type === "RECEIVABLE"
                    ? "bg-green-50 text-green-600 border-2 border-green-200"
                    : "bg-page-bg text-text-muted border border-stroke hover:bg-rosa-light/30"
                }`}
              >
                {t("finances.receivable")}
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("finances.entryTitle")} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("finances.description")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Amount + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("finances.amount")} <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0.01"
                required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {t("finances.dueDate")} <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              {t("finances.category")} <span className="text-red-400">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              <option value="">{t("finances.selectCategory")}</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Recurring toggle (only for create) */}
          {!entry && (
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${isRecurring ? "bg-primary" : "bg-stroke"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isRecurring ? "left-5" : "left-0.5"}`} />
                </div>
                <span className="text-[13px] font-medium text-text-dark">{t("finances.recurring")}</span>
              </label>
              {isRecurring && (
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                    {t("finances.recurringMonths")}
                  </label>
                  <input
                    type="number"
                    value={recurringMonths}
                    onChange={(e) => setRecurringMonths(e.target.value)}
                    min="2"
                    max="60"
                    required
                    className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                  <p className="text-[11px] text-text-muted mt-1">{t("finances.recurringHint")}</p>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
              {submitting ? t("common.loading") : entry ? t("common.save") : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
