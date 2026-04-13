import { useSettingsStore } from "../stores/settings.store.js";
import { parseDateParts, toDateISO } from "@mimos/shared";
import type { DateParts } from "@mimos/shared";

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

/** Get current date+time as YYYY-MM-DDTHH:MM string in the configured timezone (for datetime-local inputs) */
export function getNowDateTimeISO(): string {
  const tz = getTimezone();
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  return fmt.format(new Date()).replace(" ", "T");
}

/** Get date components (year, month, day, hour, dow) in the configured timezone */
export function getDateParts(date: string | Date): DateParts {
  return parseDateParts(new Date(date), getTimezone());
}

/** Get "now" components in the configured timezone */
export function getNow(): { year: number; month: number; day: number } {
  return getDateParts(new Date());
}

/** Get today's date as YYYY-MM-DD string in the configured timezone */
export function getTodayISO(): string {
  const { year, month, day } = getNow();
  return toDateISO(year, month, day);
}

/** Get first day of current month as YYYY-MM-DD in the configured timezone */
export function getFirstDayOfMonthISO(): string {
  const { year, month } = getNow();
  return toDateISO(year, month, 1);
}

/** Get last day of current month as YYYY-MM-DD in the configured timezone */
export function getLastDayOfMonthISO(): string {
  const { year, month } = getNow();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return toDateISO(year, month, lastDay);
}
