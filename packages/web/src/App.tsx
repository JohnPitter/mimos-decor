import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useAuthStore } from "./stores/auth.store.js";
import { AppLayout } from "./components/layout/AppLayout.js";
import { ProtectedRoute } from "./components/common/ProtectedRoute.js";
import { Home } from "./pages/Home.js";
import { Login } from "./pages/Login.js";

// Lazy load app pages
import { lazy, Suspense } from "react";
const Dashboard = lazy(() => import("./pages/Dashboard.js"));
const Products = lazy(() => import("./pages/Products.js"));
const Sales = lazy(() => import("./pages/Sales.js"));
const UsersPage = lazy(() => import("./pages/Users.js"));
const AuditLogs = lazy(() => import("./pages/AuditLogs.js"));
const Profile = lazy(() => import("./pages/Profile.js"));
const Gateways = lazy(() => import("./pages/Gateways.js"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<PageLoader />}><Products /></Suspense>} />
          <Route path="sales" element={<Suspense fallback={<PageLoader />}><Sales /></Suspense>} />
          <Route path="users" element={<ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><UsersPage /></Suspense></ProtectedRoute>} />
          <Route path="logs" element={<ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><AuditLogs /></Suspense></ProtectedRoute>} />
          <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
          <Route path="gateways" element={<ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><Gateways /></Suspense></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
