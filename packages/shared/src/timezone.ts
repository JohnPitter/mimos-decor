/** Date components extracted from a timezone-aware parse */
export interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dow: number;
}

const partsCache = new Map<string, Intl.DateTimeFormat>();
function getFormatter(tz: string): Intl.DateTimeFormat {
  let fmt = partsCache.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      weekday: "short", hour12: false,
    });
    partsCache.set(tz, fmt);
  }
  return fmt;
}

const DOW_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Extract date/time components from a Date in a given timezone */
export function parseDateParts(date: Date, tz: string): DateParts {
  const fmt = getFormatter(tz);
  const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
  const h = Number(parts.hour);
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    hour: h === 24 ? 0 : h,
    minute: Number(parts.minute),
    second: Number(parts.second),
    dow: DOW_MAP[parts.weekday] ?? 0,
  };
}

/**
 * Convert a local date/time in the given timezone to a UTC Date.
 * E.g. midnight in America/Sao_Paulo (UTC-3) → 03:00 UTC.
 */
export function localToUTC(tz: string, year: number, month: number, day: number, hour = 0, minute = 0, second = 0): Date {
  const guess = new Date(Date.UTC(year, month, day, hour, minute, second));
  const p = parseDateParts(guess, tz);
  const tzAsUTC = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second);
  const offsetMs = tzAsUTC - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

/** Format date components as YYYY-MM-DD */
export function toDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
