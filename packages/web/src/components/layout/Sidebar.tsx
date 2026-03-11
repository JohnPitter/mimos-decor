import { NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Package, ShoppingCart, Users, ScrollText, LogOut, UserCircle, Plug, Settings, FileBarChart } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store.js";
import { useSidebarStore } from "../../stores/sidebar.store.js";
import { useEffect } from "react";

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const { open, close } = useSidebarStore();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  const NAV_ITEMS = [
    { to: "/app/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/app/products", label: t("nav.products"), icon: Package },
    { to: "/app/sales", label: t("nav.sales"), icon: ShoppingCart },
    { to: "/app/reports", label: t("nav.reports"), icon: FileBarChart },
  ];

  const ADMIN_ITEMS = [
    { to: "/app/users", label: t("nav.users"), icon: Users },
    { to: "/app/gateways", label: t("nav.gateways"), icon: Plug },
    { to: "/app/logs", label: t("nav.auditLogs"), icon: ScrollText },
  ];

  const items = user?.role === "ADMIN" ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[220px] bg-sidebar-bg flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
            to="/app/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-white/70 hover:text-white hover:bg-sidebar-hover"
              }`
            }
          >
            <Settings size={18} />
            {t("nav.settings")}
          </NavLink>
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
    </>
  );
}
