import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { X, Plus, Pencil, Trash2, Tag } from "lucide-react";
import type { FinanceCategory } from "@mimos/shared";

interface Props {
  open: boolean;
  categories: FinanceCategory[];
  onClose: () => void;
  onCreate: (data: Record<string, unknown>) => Promise<void>;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const COLORS = ["#EF4444", "#F59E0B", "#F97316", "#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#06B6D4", "#6B7280", "#DC2626"];

export function CategoryManagerDialog({ open, categories, onClose, onCreate, onUpdate, onDelete, onRefresh }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<FinanceCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"PAYABLE" | "RECEIVABLE">("PAYABLE");
  const [color, setColor] = useState(COLORS[0]);

  if (!open) return null;

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    setName("");
    setType("PAYABLE");
    setColor(COLORS[0]);
  };

  const startEdit = (cat: FinanceCategory) => {
    setCreating(false);
    setEditing(cat);
    setName(cat.name);
    setColor(cat.color);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await onUpdate(editing.id, { name, color });
      } else {
        await onCreate({ name, type, color, icon: "Tag" });
      }
      await onRefresh();
      setEditing(null);
      setCreating(false);
      toast.success(t("common.save"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("finances.categoryError"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      await onRefresh();
      toast.success(t("finances.categoryDeleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("finances.categoryDeleteError"));
    }
  };

  const payableCategories = categories.filter((c) => c.type === "PAYABLE");
  const receivableCategories = categories.filter((c) => c.type === "RECEIVABLE");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in mx-4 sm:mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-[18px] font-bold text-text-dark">{t("finances.categories")}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Create / Edit form */}
          {(creating || editing) && (
            <div className="p-4 border border-stroke rounded-xl bg-page-bg space-y-3 animate-fade-in">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("finances.categoryName")}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              {creating && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType("PAYABLE")}
                    className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${type === "PAYABLE" ? "bg-red-50 text-red-600 border border-red-200" : "bg-card-bg text-text-muted border border-stroke"}`}
                  >
                    {t("finances.payable")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("RECEIVABLE")}
                    className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${type === "RECEIVABLE" ? "bg-green-50 text-green-600 border border-green-200" : "bg-card-bg text-text-muted border border-stroke"}`}
                  >
                    {t("finances.receivable")}
                  </button>
                </div>
              )}
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setCreating(false); setEditing(null); }}
                  className="flex-1 py-2 border border-stroke rounded-lg text-[13px] font-medium text-text-muted hover:bg-card-bg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-[13px] font-bold transition-all"
                >
                  {t("common.save")}
                </button>
              </div>
            </div>
          )}

          {/* Categories list */}
          {[
            { label: t("finances.payable"), items: payableCategories },
            { label: t("finances.receivable"), items: receivableCategories },
          ].map((group) => (
            <div key={group.label}>
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">{group.label}</h3>
              <div className="space-y-1">
                {group.items.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-page-bg transition-colors group">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <Tag size={14} className="text-text-muted shrink-0" />
                    <span className="text-[13px] font-medium text-text-dark flex-1">{cat.name}</span>
                    {cat.isDefault && (
                      <span className="text-[10px] font-semibold text-text-muted bg-page-bg px-2 py-0.5 rounded">{t("gateways.default")}</span>
                    )}
                    {!cat.isDefault && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(cat)} className="p-1 rounded text-text-muted hover:text-primary transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="p-1 rounded text-text-muted hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add button */}
          {!creating && !editing && (
            <button
              onClick={startCreate}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-stroke rounded-lg text-[13px] font-medium text-text-muted hover:text-primary hover:border-primary transition-all"
            >
              <Plus size={14} />
              {t("finances.newCategory")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
