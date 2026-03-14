export interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  sidebarBg: string;
  sidebarHover: string;
  pageBg: string;
  cardBg: string;
  stroke: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  isAdmin: boolean;
  roleId: string | null;
  role: Role | null;
  permissions: string[];
  permissionOverrides: string[];
  themeColors: ThemeColors | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  roleId?: string;
  permissionOverrides?: string[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  isAdmin?: boolean;
  roleId?: string;
  permissionOverrides?: string[];
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  themeColors?: ThemeColors;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateRoleInput {
  name: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  name?: string;
  permissions?: string[];
}
