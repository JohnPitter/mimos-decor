import { NavLink } from "react-router";
import { LayoutDashboard, Package, ShoppingCart, Users, ScrollText, LogOut } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store.js";

const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/products", label: "Produtos", icon: Package },
  { to: "/app/sales", label: "Vendas", icon: ShoppingCart },
];

const ADMIN_ITEMS = [
  { to: "/app/users", label: "Usuarios", icon: Users },
  { to: "/app/logs", label: "Auditoria", icon: ScrollText },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
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

      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-sidebar-hover transition-colors w-full text-[14px]"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
