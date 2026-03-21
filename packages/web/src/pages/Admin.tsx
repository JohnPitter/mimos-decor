import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Header } from "../components/layout/Header.js";
import { useSettingsStore } from "../stores/settings.store.js";
import { ShieldCheck, Clock } from "lucide-react";

const BR_TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
  { value: "America/Cuiaba", label: "Cuiabá (GMT-4)" },
  { value: "America/Belem", label: "Belém (GMT-3)" },
  { value: "America/Recife", label: "Recife (GMT-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Bahia", label: "Salvador (GMT-3)" },
  { value: "America/Campo_Grande", label: "Campo Grande (GMT-4)" },
  { value: "America/Porto_Velho", label: "Porto Velho (GMT-4)" },
  { value: "America/Boa_Vista", label: "Boa Vista (GMT-4)" },
];

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
      key: "allowSaleEditing",
      labelKey: "admin.allowSaleEditing",
      descKey: "admin.allowSaleEditingDesc",
      value: appSettings.allowSaleEditing,
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

        {/* Timezone */}
        <div className="bg-card-bg border border-stroke rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-text-dark">{t("admin.timezone")}</p>
              <p className="text-[12px] text-text-muted">{t("admin.timezoneDesc")}</p>
            </div>
          </div>
          <select
            value={appSettings.timezone}
            onChange={async (e) => {
              try {
                await updateAppSettings({ timezone: e.target.value });
                toast.success(t("settings.settingsUpdated"));
              } catch {
                toast.error(t("settings.settingsError"));
              }
            }}
            className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          >
            {BR_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          <p className="text-[11px] text-text-muted mt-2">
            {t("admin.currentTime")}: {new Date().toLocaleString("pt-BR", { timeZone: appSettings.timezone, dateStyle: "short", timeStyle: "medium" })}
          </p>
        </div>
      </div>
    </div>
  );
}
