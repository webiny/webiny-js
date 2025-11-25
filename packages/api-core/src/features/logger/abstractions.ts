import { createAbstraction } from "@webiny/feature/api";
import type { Logger } from "@webiny/logger";

/**
 * LoggerService abstraction
 * Provides structured logging capabilities throughout the API
 */
export interface ILoggerService {
    /**
     * Get the underlying logger instance
     */
    getLogger(): Logger;

    /**
     * Create a child logger with additional context
     */
    child(bindings: Record<string, any>): Logger;

    /**
     * Log a fatal error
     */
    fatal(msg: string, ...args: any[]): void;
    fatal(obj: object, msg?: string, ...args: any[]): void;

    /**
     * Log an error
     */
    error(msg: string, ...args: any[]): void;
    error(obj: object, msg?: string, ...args: any[]): void;

    /**
     * Log a warning
     */
    warn(msg: string, ...args: any[]): void;
    warn(obj: object, msg?: string, ...args: any[]): void;

    /**
     * Log an informational message
     */
    info(msg: string, ...args: any[]): void;
    info(obj: object, msg?: string, ...args: any[]): void;

    /**
     * Log a debug message
     */
    debug(msg: string, ...args: any[]): void;
    debug(obj: object, msg?: string, ...args: any[]): void;

    /**
     * Log a trace message
     */
    trace(msg: string, ...args: any[]): void;
    trace(obj: object, msg?: string, ...args: any[]): void;
}

export const LoggerService = createAbstraction<ILoggerService>("LoggerService");

export namespace LoggerService {
    export type Interface = ILoggerService;
}
