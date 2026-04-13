import { prisma } from "./prisma.js";
import { parseDateParts, localToUTC } from "@mimos/shared";

const DEFAULT_TZ = "America/Sao_Paulo";

let cachedTz: string | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getConfiguredTimezone(): Promise<string> {
  if (cachedTz && Date.now() - cachedAt < CACHE_TTL) return cachedTz;
  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
    cachedTz = settings?.timezone ?? DEFAULT_TZ;
  } catch {
    cachedTz = DEFAULT_TZ;
  }
  cachedAt = Date.now();
  return cachedTz;
}

export function invalidateTimezoneCache() {
  cachedTz = null;
}

export function getNowInTimezone(tz: string) {
  return parseDateParts(new Date(), tz);
}

export function getStartOfDayUTC(tz: string): Date {
  const { year, month, day } = getNowInTimezone(tz);
  return localToUTC(tz, year, month, day);
}

export function getStartOfMonthUTC(tz: string): Date {
  const { year, month } = getNowInTimezone(tz);
  return localToUTC(tz, year, month, 1);
}

export function getEndOfMonthUTC(tz: string): Date {
  const { year, month } = getNowInTimezone(tz);
  const lastDay = new Date(year, month + 1, 0).getDate();
  return localToUTC(tz, year, month, lastDay, 23, 59, 59);
}

export function getTodayBoundariesUTC(tz: string): { start: Date; end: Date } {
  const { year, month, day } = getNowInTimezone(tz);
  return {
    start: localToUTC(tz, year, month, day),
    end: localToUTC(tz, year, month, day, 23, 59, 59),
  };
}

export function getTomorrowBoundariesUTC(tz: string): { start: Date; end: Date } {
  const { year, month, day } = getNowInTimezone(tz);
  return {
    start: localToUTC(tz, year, month, day + 1),
    end: localToUTC(tz, year, month, day + 1, 23, 59, 59),
  };
}
