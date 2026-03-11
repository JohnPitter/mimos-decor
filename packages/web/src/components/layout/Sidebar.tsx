import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Package, ShoppingCart, Users, ScrollText, LogOut, UserCircle, Plug } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store.js";

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { to: "/app/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/app/products", label: t("nav.products"), icon: Package },
    { to: "/app/sales", label: t("nav.sales"), icon: ShoppingCart },
  ];

  const ADMIN_ITEMS = [
    { to: "/app/users", label: t("nav.users"), icon: Users },
    { to: "/app/gateways", label: t("nav.gateways"), icon: Plug },
    { to: "/app/logs", label: t("nav.auditLogs"), icon: ScrollText },
  ];

  const items = user?.role === "ADMIN" ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-sidebar-bg flex flex-col">
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <img src="/logo.png" alt="Mimos Decor" className="w-10 h-10 rounded-lg" />
        <span className="text-white font-bold text-[15px] tracking-tight">Mimos Decor</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 animate-fade-in">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-white/70 hover:text-white hover:bg-sidebar-hover"
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <NavLink
          to="/app/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
              isActive
                ? "bg-primary text-white shadow-md"
                : "text-white/70 hover:text-white hover:bg-sidebar-hover"
            }`
          }
        >
          <UserCircle size={18} />
          {t("nav.profile")}
        </NavLink>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-sidebar-hover transition-colors w-full text-[14px]"
        >
          <LogOut size={18} />
          {t("auth.logout")}
        </button>
      </div>
    </aside>
  );
}
