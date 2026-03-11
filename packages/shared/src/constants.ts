export const GATEWAY_LABELS: Record<string, string> = {
  SHOPEE_CNPJ: "Shopee CNPJ",
  SHOPEE_CPF: "Shopee CPF",
  ML_CLASSICO: "ML Clássico",
  ML_PREMIUM: "ML Premium",
};

export const GATEWAY_COLORS: Record<string, string> = {
  SHOPEE_CNPJ: "#EE4D2D",
  SHOPEE_CPF: "#EE4D2D",
  ML_CLASSICO: "#FFE600",
  ML_PREMIUM: "#FFE600",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  OPERATOR: "Operador",
};

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },
  PRODUCTS: "/api/products",
  SALES: "/api/sales",
  SALES_IMPORT: "/api/sales/import",
  DASHBOARD: "/api/dashboard",
  USERS: "/api/users",
  AUDIT_LOGS: "/api/audit-logs",
  GATEWAYS: "/api/gateways",
} as const;
