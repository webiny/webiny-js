import type { Logger as PinoInstance } from "pino";

/**
 * Writes through one pino instance. Its methods match `Logger` from `@webiny/api-core`, so an event
 * handler can register it as that abstraction without this package depending on api-core.
 */
export class PinoLogger {
    public constructor(private readonly pinoLogger: PinoInstance) {}

    public trace(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.trace(objOrMsg, ...args);
    }

    public debug(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.debug(objOrMsg, ...args);
    }

    public info(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.info(objOrMsg, ...args);
    }

    public warn(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.warn(objOrMsg, ...args);
    }

    public error(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.error(objOrMsg, ...args);
    }

    public fatal(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.fatal(objOrMsg, ...args);
    }

    public log(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.info(objOrMsg, ...args);
    }
}
