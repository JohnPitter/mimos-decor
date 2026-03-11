import { useState } from "react";
import { useTranslation } from "react-i18next";
import { User, Mail, Shield, Calendar, Lock, Save, Check, AlertCircle } from "lucide-react";
import { Header } from "../components/layout/Header.js";
import { useAuthStore } from "../stores/auth.store.js";
import { api } from "../lib/api.js";
import type { User as UserType } from "@mimos/shared";

export default function Profile() {
  const { t } = useTranslation();
  const { user, checkAuth } = useAuthStore();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("profile.passwordMismatch") });
      return;
    }

    if (newPassword && !currentPassword) {
      setMessage({ type: "error", text: t("profile.currentPasswordRequired") });
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (name !== user?.name) body.name = name;
      if (email !== user?.email) body.email = email;
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      if (Object.keys(body).length === 0) {
        setSaving(false);
        return;
      }

      await api.put<{ user: UserType }>("/auth/profile", body);
      await checkAuth();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: t("profile.profileUpdated") });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t("profile.updateError");
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <Header title={t("profile.title")} />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
        {/* User Card */}
        <div className="bg-card-bg border border-stroke rounded-xl p-6 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[24px]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-text-dark">{user.name}</h2>
              <p className="text-[13px] text-text-muted">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Shield size={12} className="text-primary" />
                <span className="text-[12px] font-semibold text-primary">{t(`roles.${user.role}`)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <Calendar size={12} />
            <span>{t("profile.memberSince")} {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] font-medium animate-fade-in-down ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {/* Personal Info */}
        <div className="bg-card-bg border border-stroke rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <h3 className="text-[15px] font-bold text-text-dark mb-4 flex items-center gap-2">
            <User size={18} className="text-primary" />
            {t("profile.personalInfo")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                {t("profile.name")}
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-stroke rounded-lg text-[14px] text-text-dark bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                {t("profile.email")}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-stroke rounded-lg text-[14px] text-text-dark bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card-bg border border-stroke rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <h3 className="text-[15px] font-bold text-text-dark mb-4 flex items-center gap-2">
            <Lock size={18} className="text-primary" />
            {t("profile.changePassword")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                {t("profile.currentPassword")}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-stroke rounded-lg text-[14px] text-text-dark bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                {t("profile.newPassword")}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-stroke rounded-lg text-[14px] text-text-dark bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                {t("profile.confirmPassword")}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-stroke rounded-lg text-[14px] text-text-dark bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? t("common.loading") : t("profile.saveChanges")}
        </button>
      </div>
    </div>
  );
}
