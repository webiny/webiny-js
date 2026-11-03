import type { Logger as PinoInstance } from "pino";
import type { Logger } from "./abstractions.js";

/** A `Logger` that writes through one pino instance. */
export class PinoLogger implements Logger.Interface {
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
