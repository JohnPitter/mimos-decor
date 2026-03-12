import { create } from "zustand";
import { api } from "../lib/api.js";
import type { User } from "@mimos/shared";

interface ThemeColors {
  primary: string;
  primaryHover: string;
  sidebarBg: string;
  sidebarHover: string;
  pageBg: string;
  cardBg: string;
  stroke: string;
}

const DEFAULT_THEME: ThemeColors = {
  primary: "#ff914d",
  primaryHover: "#f07830",
  sidebarBg: "#3D2C2C",
  sidebarHover: "#4d3a3a",
  pageBg: "#FFF9F7",
  cardBg: "#ffffff",
  stroke: "#f0e0e0",
};

interface SettingsState {
  theme: ThemeColors;
  setThemeColor: (key: keyof ThemeColors, value: string) => void;
  resetTheme: () => void;
  applyTheme: () => void;
  loadFromUser: (user: User) => void;
  saveToServer: () => Promise<void>;
}

function applyToDOM(theme: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty("--color-primary-hover", theme.primaryHover);
  root.style.setProperty("--color-sidebar-bg", theme.sidebarBg);
  root.style.setProperty("--color-sidebar-hover", theme.sidebarHover);
  root.style.setProperty("--color-page-bg", theme.pageBg);
  root.style.setProperty("--color-card-bg", theme.cardBg);
  root.style.setProperty("--color-stroke", theme.stroke);
}

function loadTheme(): ThemeColors {
  try {
    const stored = localStorage.getItem("mimos-theme");
    if (stored) return { ...DEFAULT_THEME, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_THEME;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: loadTheme(),

  setThemeColor: (key, value) => {
    const theme = { ...get().theme, [key]: value };
    set({ theme });
    localStorage.setItem("mimos-theme", JSON.stringify(theme));
    applyToDOM(theme);
  },

  resetTheme: () => {
    set({ theme: DEFAULT_THEME });
    localStorage.removeItem("mimos-theme");
    applyToDOM(DEFAULT_THEME);
    api.put("/auth/profile", { themeColors: null }).catch(() => {});
  },

  applyTheme: () => {
    applyToDOM(get().theme);
  },

  loadFromUser: (user: User) => {
    if (user.themeColors) {
      const theme = { ...DEFAULT_THEME, ...user.themeColors };
      set({ theme });
      localStorage.setItem("mimos-theme", JSON.stringify(theme));
      applyToDOM(theme);
    }
  },

  saveToServer: async () => {
    const theme = get().theme;
    await api.put("/auth/profile", { themeColors: theme });
  },
}));

export { DEFAULT_THEME };
export type { ThemeColors };
