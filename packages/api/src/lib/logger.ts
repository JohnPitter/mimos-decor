type LogLevel = "info" | "warn" | "error" | "debug";

function log(level: LogLevel, message: string, context: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, context, message, ...data };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (msg: string, ctx: string, data?: Record<string, unknown>) => log("info", msg, ctx, data),
  warn: (msg: string, ctx: string, data?: Record<string, unknown>) => log("warn", msg, ctx, data),
  error: (msg: string, ctx: string, data?: Record<string, unknown>) => log("error", msg, ctx, data),
  debug: (msg: string, ctx: string, data?: Record<string, unknown>) => log("debug", msg, ctx, data),
};
