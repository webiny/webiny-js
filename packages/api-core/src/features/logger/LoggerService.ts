import { createImplementation } from "@webiny/feature/api";
import { type Logger, pino } from "pino";
import { LoggerService as LoggerServiceAbstraction } from "./abstractions.js";

const DEFAULT_LOG_LEVEL = "info";

/**
 * Default Logger Service Implementation using Pino
 */

// TODO: pino-lambda pkg here, but hard b/c of context.
export class LoggerServiceImpl implements LoggerServiceAbstraction.Interface {
    private pinoLogger: Logger;

    constructor() {
        const level = this.getLogLevel();
        this.pinoLogger = pino({ level });
    }

    trace(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.trace(objOrMsg, ...args);
    }

    debug(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.debug(objOrMsg, ...args);
    }

    info(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.info(objOrMsg, ...args);
    }

    warn(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.warn(objOrMsg, ...args);
    }

    error(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.error(objOrMsg, ...args);
    }

    fatal(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.fatal(objOrMsg, ...args);
    }

    log(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.info(objOrMsg, ...args);
    }

    private getLogLevel() {
        return process.env.WEBINY_LOG_LEVEL || DEFAULT_LOG_LEVEL;
    }
}

export const LoggerService = createImplementation({
    abstraction: LoggerServiceAbstraction,
    implementation: LoggerServiceImpl,
    dependencies: []
});
