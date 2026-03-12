import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Shield } from "lucide-react";
import { Header } from "../components/layout/Header.js";
import { ConfirmDialog } from "../components/common/ConfirmDialog.js";
import { api } from "../lib/api.js";
import { PERMISSION_GROUPS } from "@mimos/shared";
import type { Role } from "@mimos/shared";

interface RoleWithCount extends Role {
  _count?: { users: number };
}

interface FormData {
  name: string;
  permissions: string[];
}

const EMPTY_FORM: FormData = { name: "", permissions: [] };

export default function Roles() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<RoleWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ roles: RoleWithCount[] }>("/roles");
      setRoles(data.roles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (role: RoleWithCount) => {
    setForm({ name: role.name, permissions: [...role.permissions] });
    setEditingId(role.id);
    setError("");
    setModalOpen(true);
  };

  const togglePermission = (perm: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const toggleGroup = (groupPerms: string[]) => {
    const allSelected = groupPerms.every((p) => form.permissions.includes(p));
    if (allSelected) {
      setForm((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => !groupPerms.includes(p)),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...groupPerms])],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editingId) {
        await api.put(`/roles/${editingId}`, form);
      } else {
        await api.post("/roles", form);
      }
      setModalOpen(false);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("roles.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/roles/${deleteId}`);
      toast.success(t("roles.deleteSuccess"));
      await fetchRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("roles.deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title={t("roles.title")} />

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[13px] text-text-muted">
            {roles.length} {t("common.items")}
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
          >
            <Plus size={16} />
            {t("roles.newRole")}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-card-bg rounded-xl animate-pulse" />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Shield size={48} className="mb-4 opacity-40" />
            <p className="text-[15px] font-medium">{t("common.noResults")}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-card-bg rounded-xl border border-stroke p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-text-dark">{role.name}</h3>
                    <p className="text-[12px] text-text-muted mt-1">
                      {role.permissions.length} {t("roles.permissionsCount")} · {role._count?.users ?? 0} {t("roles.usersCount")}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {role.permissions.slice(0, 8).map((perm) => (
                        <span key={perm} className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                          {t(`permissions.${perm}`)}
                        </span>
                      ))}
                      {role.permissions.length > 8 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-500">
                          +{role.permissions.length - 8}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(role)}
                      className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                      title={t("common.edit")}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(role.id)}
                      className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                      title={t("common.delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteId}
        title={t("nav.deleteConfirmTitle")}
        message={t("roles.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-lg animate-scale-in mx-4 sm:mx-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-stroke shrink-0">
              <h2 className="text-[18px] font-bold text-text-dark">
                {editingId ? t("roles.editRole") : t("roles.createRole")}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-dark transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {error && <p className="text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div>
                <label className="block text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  {t("roles.name")} <span className="text-red-400">*</span>
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
                <label className="block text-[12px] font-semibold text-text-muted mb-2 uppercase tracking-wider">
                  {t("roles.permissions")}
                </label>
                <div className="space-y-4 max-h-[300px] overflow-y-auto border border-stroke rounded-lg p-4">
                  {PERMISSION_GROUPS.map((group) => {
                    const allSelected = group.permissions.every((p) => form.permissions.includes(p));
                    const someSelected = group.permissions.some((p) => form.permissions.includes(p));
                    return (
                      <div key={group.labelKey}>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                            onChange={() => toggleGroup(group.permissions)}
                            className="w-3.5 h-3.5 rounded accent-primary"
                          />
                          <span className="text-[12px] font-bold text-text-dark uppercase tracking-wider">{t(group.labelKey)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 ml-5">
                          {group.permissions.map((perm) => (
                            <button
                              key={perm}
                              type="button"
                              onClick={() => togglePermission(perm)}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                                form.permissions.includes(perm)
                                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                              }`}
                            >
                              {t(`permissions.${perm}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
