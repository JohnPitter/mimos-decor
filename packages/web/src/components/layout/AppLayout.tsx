import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar.js";

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-[220px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
