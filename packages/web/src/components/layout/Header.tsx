import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Globe, Menu } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store.js";
import { useSidebarStore } from "../../stores/sidebar.store.js";

export function Header({ title }: { title: string }) {
  const user = useAuthStore((s) => s.user);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toggleSidebar = useSidebarStore((s) => s.toggle);

  const toggleLanguage = () => {
    const next = i18n.language === "pt-BR" ? "en" : "pt-BR";
    i18n.changeLanguage(next);
    localStorage.setItem("language", next);
  };

  return (
    <header className="h-14 bg-card-bg border-b border-stroke flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-dark hover:bg-page-bg transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-[16px] sm:text-[18px] font-bold text-text-dark tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-text-secondary hover:bg-page-bg transition-colors"
          title={t("common.language")}
        >
          <Globe size={14} />
          {i18n.language === "pt-BR" ? "PT" : "EN"}
        </button>
        <div className="text-right hidden sm:block">
          <p className="text-[13px] font-semibold text-text-dark">{user?.name}</p>
          <p className="text-[11px] text-text-muted">{user?.isAdmin ? t("roles.ADMIN") : user?.role?.name ?? ""}</p>
        </div>
        <button
          onClick={() => navigate("/app/profile")}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[13px] hover:brightness-110 transition-all active:scale-95"
        >
          {user?.name?.charAt(0).toUpperCase()}
        </button>
      </div>
    </header>
  );
}
