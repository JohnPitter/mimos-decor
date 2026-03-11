import { create } from "zustand";
import { api } from "../lib/api.js";
import type { CustomGateway } from "@mimos/shared";
import { GATEWAY_LABELS, GATEWAY_COLORS, BUILT_IN_GATEWAYS, MARKETPLACES, buildMarketplace } from "@mimos/shared";
import type { Marketplace, CommissionTier, PixTier } from "@mimos/shared";

interface GatewayInfo {
  id: string;
  label: string;
  color: string;
  isCustom: boolean;
}

interface GatewayState {
  customGateways: CustomGateway[];
  loading: boolean;
  fetchGateways: () => Promise<void>;
  createGateway: (data: Record<string, unknown>) => Promise<void>;
  updateGateway: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteGateway: (id: string) => Promise<void>;
  getAllGateways: () => GatewayInfo[];
  getGatewayLabel: (gateway: string) => string;
  getGatewayColor: (gateway: string) => string;
  getMarketplace: (gateway: string) => Marketplace | null;
}

function deserializeTiers(raw: { maxPrice: number; pct: number; fixed: number }[]): CommissionTier[] {
  return raw.map((t) => ({
    maxPrice: t.maxPrice >= 999999999 ? Infinity : t.maxPrice,
    pct: t.pct,
    fixed: t.fixed,
  }));
}

export const useGatewayStore = create<GatewayState>((set, get) => ({
  customGateways: [],
  loading: false,

  fetchGateways: async () => {
    set({ loading: true });
    try {
      const data = await api.get<{ gateways: CustomGateway[] }>("/gateways");
      set({ customGateways: data.gateways, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createGateway: async (data) => {
    await api.post("/gateways", data);
    await get().fetchGateways();
  },

  updateGateway: async (id, data) => {
    await api.put(`/gateways/${id}`, data);
    await get().fetchGateways();
  },

  deleteGateway: async (id) => {
    await api.delete(`/gateways/${id}`);
    await get().fetchGateways();
  },

  getAllGateways: () => {
    const builtIn: GatewayInfo[] = BUILT_IN_GATEWAYS.map((id) => ({
      id,
      label: GATEWAY_LABELS[id] ?? id,
      color: GATEWAY_COLORS[id] ?? "#6B5E5E",
      isCustom: false,
    }));

    const custom: GatewayInfo[] = get().customGateways.map((g) => ({
      id: g.slug,
      label: g.name,
      color: g.color,
      isCustom: true,
    }));

    return [...builtIn, ...custom];
  },

  getGatewayLabel: (gateway) => {
    const builtin = GATEWAY_LABELS[gateway];
    if (builtin) return builtin;
    const custom = get().customGateways.find((g) => g.slug === gateway);
    return custom?.name ?? gateway;
  },

  getGatewayColor: (gateway) => {
    const builtin = GATEWAY_COLORS[gateway];
    if (builtin) return builtin;
    const custom = get().customGateways.find((g) => g.slug === gateway);
    return custom?.color ?? "#6B5E5E";
  },

  getMarketplace: (gateway) => {
    const builtin = MARKETPLACES[gateway];
    if (builtin) return builtin;
    const custom = get().customGateways.find((g) => g.slug === gateway);
    if (!custom) return null;
    return buildMarketplace(custom.slug, custom.name, {
      tiers: deserializeTiers(custom.tiers as { maxPrice: number; pct: number; fixed: number }[]),
      pixTiers: custom.pixTiers as PixTier[],
      extraFixed: custom.extraFixed,
    });
  },
}));
