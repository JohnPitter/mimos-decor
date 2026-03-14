import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Header } from "../components/layout/Header.js";
import { useSettingsStore } from "../stores/settings.store.js";
import { ShieldCheck } from "lucide-react";

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${value ? "bg-primary" : "bg-stroke"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export default function Admin() {
  const { t } = useTranslation();
  const { appSettings, fetchAppSettings, updateAppSettings } = useSettingsStore();

  useEffect(() => {
    fetchAppSettings();
  }, [fetchAppSettings]);

  const handleToggle = async (key: string, currentValue: boolean) => {
    try {
      await updateAppSettings({ [key]: !currentValue });
      toast.success(t("settings.settingsUpdated"));
    } catch {
      toast.error(t("settings.settingsError"));
    }
  };

  const items = [
    {
      key: "allowSaleDeletion",
      labelKey: "admin.allowSaleDeletion",
      descKey: "admin.allowSaleDeletionDesc",
      value: appSettings.allowSaleDeletion,
    },
    {
      key: "allowRoleManagement",
      labelKey: "admin.allowRoleManagement",
      descKey: "admin.allowRoleManagementDesc",
      value: appSettings.allowRoleManagement,
    },
  ];

  return (
    <div>
      <Header title={t("admin.title")} />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header card */}
        <div className="bg-card-bg border border-stroke rounded-xl p-6 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <ShieldCheck size={24} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-text-dark">{t("admin.title")}</h2>
              <p className="text-[13px] text-text-muted">{t("admin.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-card-bg border border-stroke rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="divide-y divide-stroke">
            {items.map((item, index) => (
              <div key={item.key} className={`flex items-center justify-between py-4 ${index === 0 ? "pt-0" : ""} ${index === items.length - 1 ? "pb-0" : ""}`}>
                <div className="pr-4">
                  <p className="text-[14px] font-semibold text-text-dark">{t(item.labelKey)}</p>
                  <p className="text-[12px] text-text-muted mt-0.5">{t(item.descKey)}</p>
                </div>
                <Toggle value={item.value} onChange={() => handleToggle(item.key, item.value)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
