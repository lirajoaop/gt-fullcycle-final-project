import { pino, type LevelWithSilent, type Logger } from 'pino';

// Structured logs: one JSON object per line, easy to search and to ship to
// tools like Loki or CloudWatch. Use level 'silent' in tests.
export function createLogger(level: LevelWithSilent): Logger {
  return pino({
    level,
    base: { service: 'orders-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
