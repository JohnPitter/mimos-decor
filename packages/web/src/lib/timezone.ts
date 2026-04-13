import { useSettingsStore } from "../stores/settings.store.js";

/** Get the configured timezone from app settings */
export function getTimezone(): string {
  return useSettingsStore.getState().appSettings.timezone || "America/Sao_Paulo";
}

/** Format a date string or Date in the configured timezone */
export function formatDate(date: string | Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  const tz = getTimezone();
  return new Date(date).toLocaleDateString(locale, { timeZone: tz, ...options });
}

/** Format a date+time string or Date in the configured timezone */
export function formatDateTime(date: string | Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  const tz = getTimezone();
  return new Date(date).toLocaleString(locale, { timeZone: tz, ...options });
}

/** Format only time in the configured timezone */
export function formatTime(date: string | Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  const tz = getTimezone();
  return new Date(date).toLocaleTimeString(locale, { timeZone: tz, ...options });
}

/** Get date components (year, month, day, hour, dow) in the configured timezone */
export function getDateParts(date: string | Date): { year: number; month: number; day: number; hour: number; dow: number } {
  const tz = getTimezone();
  const d = new Date(date);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", weekday: "short", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    hour: Number(parts.hour) === 24 ? 0 : Number(parts.hour),
    dow: dowMap[parts.weekday] ?? 0,
  };
}

/** Get "now" components in the configured timezone */
export function getNow(): { year: number; month: number; day: number } {
  return getDateParts(new Date());
}

/** Get today's date as YYYY-MM-DD string in the configured timezone */
export function getTodayISO(): string {
  const { year, month, day } = getNow();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Get first day of current month as YYYY-MM-DD in the configured timezone */
export function getFirstDayOfMonthISO(): string {
  const { year, month } = getNow();
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

/** Get last day of current month as YYYY-MM-DD in the configured timezone */
export function getLastDayOfMonthISO(): string {
  const { year, month } = getNow();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}
