import { useEffect } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar.js";
import { useGatewayStore } from "../../stores/gateway.store.js";

export function AppLayout() {
  const fetchGateways = useGatewayStore((s) => s.fetchGateways);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-[220px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
