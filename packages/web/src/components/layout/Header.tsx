import { useAuthStore } from "../../stores/auth.store.js";
import { ROLE_LABELS } from "@mimos/shared";

export function Header({ title }: { title: string }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-14 bg-card-bg border-b border-stroke flex items-center justify-between px-6">
      <h1 className="text-[18px] font-bold text-text-dark tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-[13px] font-semibold text-text-dark">{user?.name}</p>
          <p className="text-[11px] text-text-muted">{user?.role ? ROLE_LABELS[user.role] : ""}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[13px]">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
