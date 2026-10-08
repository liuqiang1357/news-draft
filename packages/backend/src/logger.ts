import type { LoggerService } from "@nestjs/common";
import pino from "pino";
export function createLogger(service: string, level: string): LoggerService {
  const logger = pino({ name: service, level });
  // Nest lifecycle messages are internal; sanitize URLs and credential-like fields.
  const safeMessage = (message: unknown): string =>
    typeof message === "string"
      ? message
          .replace(/(?:https?|postgres(?:ql)?|rediss?):\/\/\S+/gi, "[url]")
          .replace(/(?:password|token|api[_-]?key|authorization)\s*[:=]\s*\S+/gi, "[credential]")
      : "Application event";
  return {
    log: (message: unknown) => logger.info(safeMessage(message)),
    warn: (message: unknown) => logger.warn(safeMessage(message)),
    error: (message: unknown) => logger.error(safeMessage(message)),
    debug: (message: unknown) => logger.debug(safeMessage(message)),
    verbose: (message: unknown) => logger.trace(safeMessage(message)),
    fatal: (message: unknown) => logger.fatal(safeMessage(message)),
  };
}
