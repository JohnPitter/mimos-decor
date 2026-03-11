import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", variant = "danger", onConfirm, onCancel }: Props) {
  if (!open) return null;

  const btnClass = variant === "danger"
    ? "bg-red-500 hover:bg-red-600 text-white"
    : "bg-yellow-500 hover:bg-yellow-600 text-white";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-sm mx-4 sm:mx-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 className="text-[16px] font-bold text-text-dark mb-2">{title}</h3>
          <p className="text-[13px] text-text-secondary leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 p-4 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-muted hover:bg-page-bg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] ${btnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
