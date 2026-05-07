/**
 * Tiny structured JSON logger. Use instead of bare `console.log` so logs are
 * grep-able and ingestible by log shippers (Vercel, Datadog, etc).
 *
 *   log.info("checkout.created", { bookingId, userId });
 *   log.error("email.failed", { err: e.message, toEmail });
 *
 * In dev, output is plain. In production (process.env.NODE_ENV === 'production'),
 * each line is a single JSON object so it parses cleanly in log dashboards.
 */

type Level = "debug" | "info" | "warn" | "error";

type Fields = Record<string, unknown>;

function emit(level: Level, message: string, fields?: Fields) {
  const payload = {
    level,
    msg: message,
    ts: new Date().toISOString(),
    ...fields,
  };
  const sink = level === "error" || level === "warn" ? console.error : console.log;
  if (process.env.NODE_ENV === "production") {
    sink(JSON.stringify(payload));
  } else {
    sink(`[${level}] ${message}`, fields ?? "");
  }
}

export const log = {
  debug: (msg: string, fields?: Fields) => emit("debug", msg, fields),
  info: (msg: string, fields?: Fields) => emit("info", msg, fields),
  warn: (msg: string, fields?: Fields) => emit("warn", msg, fields),
  error: (msg: string, fields?: Fields) => emit("error", msg, fields),
};
