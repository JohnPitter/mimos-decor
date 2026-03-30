import { prisma } from "./prisma.js";

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

export function getNowInTimezone(tz: string): { year: number; month: number; day: number; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function getStartOfDayUTC(tz: string): Date {
  const { year, month, day } = getNowInTimezone(tz);
  return new Date(Date.UTC(year, month, day));
}

export function getStartOfMonthUTC(tz: string): Date {
  const { year, month } = getNowInTimezone(tz);
  return new Date(Date.UTC(year, month, 1));
}

export function getEndOfMonthUTC(tz: string): Date {
  const { year, month } = getNowInTimezone(tz);
  return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
}

export function getTodayBoundariesUTC(tz: string): { start: Date; end: Date } {
  const { year, month, day } = getNowInTimezone(tz);
  return {
    start: new Date(Date.UTC(year, month, day)),
    end: new Date(Date.UTC(year, month, day, 23, 59, 59)),
  };
}

export function getTomorrowBoundariesUTC(tz: string): { start: Date; end: Date } {
  const { year, month, day } = getNowInTimezone(tz);
  return {
    start: new Date(Date.UTC(year, month, day + 1)),
    end: new Date(Date.UTC(year, month, day + 1, 23, 59, 59)),
  };
}
