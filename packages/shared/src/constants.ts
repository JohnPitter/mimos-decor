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
  FINANCES: "/api/finances",
  FINANCE_CATEGORIES: "/api/finance-categories",
} as const;

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_EDIT: "products:edit",
  PRODUCTS_DELETE: "products:delete",
  SALES_VIEW: "sales:view",
  SALES_CREATE: "sales:create",
  SALES_IMPORT: "sales:import",
  SALES_UPDATE_STATUS: "sales:updateStatus",
  REPORTS_VIEW: "reports:view",
  GATEWAYS_VIEW: "gateways:view",
  GATEWAYS_MANAGE: "gateways:manage",
  USERS_VIEW: "users:view",
  USERS_MANAGE: "users:manage",
  SETTINGS_THEME: "settings:theme",
  AUDIT_LOGS_VIEW: "auditLogs:view",
  FINANCES_VIEW: "finances:view",
  FINANCES_CREATE: "finances:create",
  FINANCES_EDIT: "finances:edit",
  FINANCES_DELETE: "finances:delete",
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

export const PERMISSION_GROUPS: { labelKey: string; permissions: PermissionKey[] }[] = [
  { labelKey: "nav.dashboard", permissions: [PERMISSIONS.DASHBOARD_VIEW] },
  { labelKey: "nav.products", permissions: [PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_EDIT, PERMISSIONS.PRODUCTS_DELETE] },
  { labelKey: "nav.sales", permissions: [PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_IMPORT, PERMISSIONS.SALES_UPDATE_STATUS] },
  { labelKey: "nav.reports", permissions: [PERMISSIONS.REPORTS_VIEW] },
  { labelKey: "nav.gateways", permissions: [PERMISSIONS.GATEWAYS_VIEW, PERMISSIONS.GATEWAYS_MANAGE] },
  { labelKey: "nav.users", permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE] },
  { labelKey: "nav.settings", permissions: [PERMISSIONS.SETTINGS_THEME] },
  { labelKey: "nav.auditLogs", permissions: [PERMISSIONS.AUDIT_LOGS_VIEW] },
  { labelKey: "nav.finances", permissions: [PERMISSIONS.FINANCES_VIEW, PERMISSIONS.FINANCES_CREATE, PERMISSIONS.FINANCES_EDIT, PERMISSIONS.FINANCES_DELETE] },
];
