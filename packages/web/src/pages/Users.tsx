import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Users as UsersIcon } from "lucide-react";
import { Header } from "../components/layout/Header.js";
import { ConfirmDialog } from "../components/common/ConfirmDialog.js";
import { useUserStore } from "../stores/user.store.js";
import type { UserRole } from "@mimos/shared";

interface FormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const EMPTY_FORM: FormData = { name: "", email: "", password: "", role: "OPERATOR" };

export default function Users() {
  const { t } = useTranslation();
  const { users, total, loading, fetchUsers, createUser, updateUser, deleteUser } = useUserStore();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (user: { id: string; name: string; email: string; role: UserRole }) => {
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setEditingId(user.id);
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editingId) {
        const data: Record<string, string> = { name: form.name, email: form.email, role: form.role };
        if (form.password) data.password = form.password;
        await updateUser(editingId, data);
      } else {
        await createUser(form);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.updateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteUser(deleteId);
      toast.success(t("users.deleteSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("users.deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title={t("users.title")} />

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[13px] text-text-muted">
            {total} {t("common.items")}
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
          >
            <Plus size={16} />
            {t("users.newUser")}
          </button>
        </div>

        {loading && users.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-card-bg rounded-xl animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <UsersIcon size={48} className="mb-4 opacity-40" />
            <p className="text-[15px] font-medium">{t("common.noResults")}</p>
          </div>
        ) : (
          <div className="bg-card-bg rounded-xl border border-stroke overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-stroke">
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-text-muted uppercase tracking-wider">{t("users.name")}</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-text-muted uppercase tracking-wider">{t("users.email")}</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-text-muted uppercase tracking-wider">{t("users.role")}</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-text-muted uppercase tracking-wider">{t("users.createdAt")}</th>
                  <th className="text-right px-5 py-3 text-[12px] font-semibold text-text-muted uppercase tracking-wider">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} className="border-b border-stroke last:border-b-0 hover:bg-page-bg/50 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 40}ms` }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[13px]">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[14px] font-medium text-text-dark">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[14px] text-text-muted">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          user.role === "ADMIN"
                            ? "bg-primary/10 text-primary"
                            : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {t(`roles.${user.role}`)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                          title={t("common.edit")}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                          title={t("common.delete")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-[13px] rounded-lg border border-stroke hover:bg-card-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("common.previous")}
            </button>
            <span className="text-[13px] text-text-muted px-3">{page} {t("common.of")} {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-[13px] rounded-lg border border-stroke hover:bg-card-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteId}
        title={t("nav.deleteConfirmTitle")}
        message={t("users.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-md animate-scale-in mx-4 sm:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stroke">
              <h2 className="text-[18px] font-bold text-text-dark">
                {editingId ? t("users.editUser") : t("users.createUser")}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-dark transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  {t("users.name")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  {t("users.email")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  {t("users.password")} {!editingId && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                  className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  {t("users.role")} <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                >
                  <option value="ADMIN">{t("roles.ADMIN")}</option>
                  <option value="OPERATOR">{t("roles.OPERATOR")}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-muted hover:bg-page-bg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                >
                  {submitting ? t("common.loading") : editingId ? t("common.save") : t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
