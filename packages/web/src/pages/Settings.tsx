import { useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/layout/Header.js";
import { useSettingsStore, DEFAULT_THEME } from "../stores/settings.store.js";
import type { ThemeColors } from "../stores/settings.store.js";
import { Palette, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ColorField {
  key: keyof ThemeColors;
  labelKey: string;
  description: string;
}

const COLOR_FIELDS: ColorField[] = [
  { key: "primary", labelKey: "settings.colorPrimary", description: "settings.colorPrimaryDesc" },
  { key: "primaryHover", labelKey: "settings.colorPrimaryHover", description: "settings.colorPrimaryHoverDesc" },
  { key: "sidebarBg", labelKey: "settings.colorSidebar", description: "settings.colorSidebarDesc" },
  { key: "sidebarHover", labelKey: "settings.colorSidebarHover", description: "settings.colorSidebarHoverDesc" },
  { key: "pageBg", labelKey: "settings.colorPageBg", description: "settings.colorPageBgDesc" },
  { key: "cardBg", labelKey: "settings.colorCardBg", description: "settings.colorCardBgDesc" },
  { key: "stroke", labelKey: "settings.colorStroke", description: "settings.colorStrokeDesc" },
];

export default function Settings() {
  const { t } = useTranslation();
  const { theme, setThemeColor, resetTheme, saveToServer } = useSettingsStore();
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const debouncedSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToServer().catch(() => {});
    }, 1000);
  }, [saveToServer]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setThemeColor(key, value);
    debouncedSave();
  };

  const handleReset = () => {
    resetTheme();
    toast.success(t("settings.resetSuccess"));
  };

  return (
    <div>
      <Header title={t("settings.title")} />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header card */}
        <div className="bg-card-bg border border-stroke rounded-xl p-6 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Palette size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-text-dark">{t("settings.themeTitle")}</h2>
                <p className="text-[13px] text-text-muted">{t("settings.themeSubtitle")}</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-stroke rounded-lg text-[13px] font-medium text-text-secondary hover:bg-page-bg transition-colors"
            >
              <RotateCcw size={14} />
              {t("settings.resetColors")}
            </button>
          </div>
        </div>

        {/* Color fields */}
        <div className="bg-card-bg border border-stroke rounded-xl p-6 space-y-5 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          {COLOR_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-4">
              <input
                type="color"
                value={theme[field.key]}
                onChange={(e) => handleColorChange(field.key, e.target.value)}
                className="w-12 h-12 rounded-lg border border-stroke cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-text-dark">{t(field.labelKey)}</p>
                  {theme[field.key] !== DEFAULT_THEME[field.key] && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">
                      {t("settings.modified")}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-text-muted">{t(field.description)}</p>
                <p className="text-[11px] font-mono text-text-muted mt-0.5">{theme[field.key]}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="bg-card-bg border border-stroke rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <h3 className="text-[15px] font-bold text-text-dark mb-4">{t("settings.preview")}</h3>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-semibold">
              {t("settings.previewButton")}
            </button>
            <button className="px-4 py-2 border border-stroke rounded-lg text-[13px] font-medium text-text-secondary">
              {t("common.cancel")}
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-page-bg rounded-lg border border-stroke">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[12px] text-text-secondary">{t("settings.previewAccent")}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: theme.sidebarBg }} />
            <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: theme.pageBg, border: `1px solid ${theme.stroke}` }} />
            <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.stroke}` }} />
            <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: theme.primary }} />
          </div>
        </div>
      </div>
    </div>
  );
}
