const levels = ['debug', 'info', 'warn', 'error'] as const;
type Level = typeof levels[number];

function log(level: Level, message: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  const out = meta !== undefined
    ? `[${ts}] [${level.toUpperCase()}] ${message} ${JSON.stringify(meta)}`
    : `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (level === 'error') {
    console.error(out);
  } else {
    console.log(out);
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log('debug', msg, meta),
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
};
