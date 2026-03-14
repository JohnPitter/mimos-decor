import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Header } from "../components/layout/Header.js";
import { FinanceFormDialog } from "../components/finances/FinanceFormDialog.js";
import { CategoryManagerDialog } from "../components/finances/CategoryManagerDialog.js";
import { ConfirmDialog } from "../components/common/ConfirmDialog.js";
import { useFinanceStore } from "../stores/finance.store.js";
import { formatBRL } from "@mimos/shared";
import type { FinanceEntry } from "@mimos/shared";
import {
  Plus, Search, Pencil, Trash2, TrendingDown, TrendingUp, AlertTriangle,
  CheckCircle, Check, Tags, Filter,
} from "lucide-react";

export default function Finances() {
  const { t } = useTranslation();
  const {
    entries, total, loading, summary, categories,
    fetchEntries, fetchSummary, fetchCategories,
    createEntry, updateEntry, deleteEntry, deleteRecurringGroup, payEntry,
    createCategory, updateCategory, deleteCategory,
  } = useFinanceStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<FinanceEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const loadEntries = useCallback(() => {
    fetchEntries({
      search: search || undefined,
      type: filterType || undefined,
      status: filterStatus || undefined,
      categoryId: filterCategory || undefined,
      page,
    });
  }, [fetchEntries, search, filterType, filterStatus, filterCategory, page]);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { fetchSummary(); fetchCategories(); }, [fetchSummary, fetchCategories]);
  useEffect(() => { setPage(1); }, [search, filterType, filterStatus, filterCategory]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (editEntry) {
      await updateEntry(editEntry.id, data);
    } else {
      await createEntry(data);
    }
    setEditEntry(null);
    loadEntries();
    fetchSummary();
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteGroupId) {
        await deleteRecurringGroup(deleteGroupId);
        toast.success(t("finances.groupDeleted"));
      } else if (deleteId) {
        await deleteEntry(deleteId);
        toast.success(t("finances.deleteSuccess"));
      }
      loadEntries();
      fetchSummary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("finances.deleteError"));
    } finally {
      setDeleteId(null);
      setDeleteGroupId(null);
    }
  };

  const handlePay = async (id: string) => {
    try {
      await payEntry(id);
      toast.success(t("finances.paidSuccess"));
      loadEntries();
      fetchSummary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("finances.payError"));
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-green-50 text-green-700";
      case "OVERDUE": return "bg-red-50 text-red-700";
      case "CANCELLED": return "bg-gray-100 text-gray-500";
      default: return "bg-yellow-50 text-yellow-700";
    }
  };

  const typeColor = (type: string) => {
    return type === "PAYABLE" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600";
  };

  return (
    <div>
      <Header title={t("finances.title")} />
      <div className="p-4 sm:p-6 animate-fade-in">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 animate-fade-in-down">
          <SummaryCard
            label={t("finances.totalPayable")}
            value={formatBRL(summary?.totalPayable ?? 0)}
            icon={<TrendingDown size={20} />}
            color="text-red-500"
            bgColor="bg-red-50"
          />
          <SummaryCard
            label={t("finances.totalReceivable")}
            value={formatBRL(summary?.totalReceivable ?? 0)}
            icon={<TrendingUp size={20} />}
            color="text-green-500"
            bgColor="bg-green-50"
          />
          <SummaryCard
            label={t("finances.overdue")}
            value={`${summary?.overdueCount ?? 0} — ${formatBRL(summary?.overdueAmount ?? 0)}`}
            icon={<AlertTriangle size={20} />}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
          />
          <SummaryCard
            label={t("finances.paidThisMonth")}
            value={formatBRL(summary?.paidThisMonth ?? 0)}
            icon={<CheckCircle size={20} />}
            color="text-primary"
            bgColor="bg-orange-50"
          />
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("finances.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 border border-stroke rounded-lg text-[14px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all sm:max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCategoryDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-stroke rounded-lg text-[13px] font-medium text-text-secondary hover:bg-page-bg transition-colors"
            >
              <Tags size={14} />
              {t("finances.categories")}
            </button>
            <button
              onClick={() => { setEditEntry(null); setDialogOpen(true); }}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Plus size={16} /> {t("finances.newEntry")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
            <Filter size={12} />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 border border-stroke rounded-lg text-[12px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">{t("finances.allTypes")}</option>
            <option value="PAYABLE">{t("finances.payable")}</option>
            <option value="RECEIVABLE">{t("finances.receivable")}</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-stroke rounded-lg text-[12px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">{t("finances.allStatuses")}</option>
            <option value="PENDING">{t("finances.statusPending")}</option>
            <option value="PAID">{t("finances.statusPaid")}</option>
            <option value="OVERDUE">{t("finances.statusOverdue")}</option>
            <option value="CANCELLED">{t("finances.statusCancelled")}</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 border border-stroke rounded-lg text-[12px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">{t("finances.allCategories")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-card-bg border border-stroke rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke bg-page-bg">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("finances.entryTitle")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("finances.category")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("finances.type")}</th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("finances.amount")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("finances.dueDate")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("finances.status")}</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t("finances.installment")}</th>
                  <th className="px-3 py-3 w-28"></th>
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
                ) : entries.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-text-muted text-[14px]">{t("common.noResults")}</td></tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-stroke/50 hover:bg-rosa-light/30 transition-colors animate-fade-in-up ${entry.status === "OVERDUE" ? "border-l-4 border-l-red-400" : ""}`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-4 py-3">
                        <p className="text-[14px] font-semibold text-text-dark">{entry.title}</p>
                        {entry.description && <p className="text-[11px] text-text-muted">{entry.description}</p>}
                      </td>
                      <td className="text-center px-3 py-3">
                        {entry.category && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold text-white"
                            style={{ backgroundColor: entry.category.color }}
                          >
                            {entry.category.name}
                          </span>
                        )}
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${typeColor(entry.type)}`}>
                          {t(entry.type === "PAYABLE" ? "finances.payable" : "finances.receivable")}
                        </span>
                      </td>
                      <td className="text-right px-3 py-3 text-[13px] font-semibold text-text-dark">
                        {formatBRL(entry.amount)}
                      </td>
                      <td className="text-center px-3 py-3 text-[13px] text-text-dark">
                        {new Date(entry.dueDate).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${statusColor(entry.status)}`}>
                          {t(`finances.status${entry.status.charAt(0) + entry.status.slice(1).toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3 text-[12px] text-text-muted">
                        {entry.isRecurring && entry.installmentNumber && entry.recurringMonths
                          ? `${entry.installmentNumber}/${entry.recurringMonths}`
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1 justify-end">
                          {(entry.status === "PENDING" || entry.status === "OVERDUE") && (
                            <button
                              onClick={() => handlePay(entry.id)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-green-600 hover:bg-green-50 transition-all"
                              title={t("finances.markPaid")}
                            >
                              <Check size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditEntry(entry); setDialogOpen(true); }}
                            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-rosa-light transition-all"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (entry.recurringGroupId) {
                                setDeleteGroupId(entry.recurringGroupId);
                              } else {
                                setDeleteId(entry.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stroke hover:bg-neutral-bg2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("common.previous")}
            </button>
            <span className="text-xs text-text-muted">{page} {t("common.of")} {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stroke hover:bg-neutral-bg2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </div>

      <FinanceFormDialog
        open={dialogOpen}
        entry={editEntry}
        categories={categories}
        onClose={() => { setDialogOpen(false); setEditEntry(null); }}
        onSubmit={handleSubmit}
      />
      <CategoryManagerDialog
        open={categoryDialogOpen}
        categories={categories}
        onClose={() => setCategoryDialogOpen(false)}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
        onRefresh={fetchCategories}
      />
      <ConfirmDialog
        open={!!deleteId || !!deleteGroupId}
        title={t("nav.deleteConfirmTitle")}
        message={deleteGroupId ? t("finances.deleteGroupConfirm") : t("finances.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteId(null); setDeleteGroupId(null); }}
      />
    </div>
  );
}

function SummaryCard({ label, value, icon, color, bgColor }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card-bg border border-stroke rounded-xl p-4 sm:p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg ${bgColor} flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[18px] sm:text-[20px] font-bold text-text-dark tracking-tight">{value}</p>
    </div>
  );
}
