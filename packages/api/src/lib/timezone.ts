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

/**
 * Convert a local date/time in the given timezone to a UTC Date.
 * E.g. midnight in America/Sao_Paulo (UTC-3) → 03:00 UTC.
 */
function localToUTC(tz: string, year: number, month: number, day: number, hour = 0, minute = 0, second = 0): Date {
  const guess = new Date(Date.UTC(year, month, day, hour, minute, second));
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(guess).map(p => [p.type, p.value]));
  const tzH = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  const tzAsUTC = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), tzH, Number(parts.minute), Number(parts.second));
  const offsetMs = tzAsUTC - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
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
