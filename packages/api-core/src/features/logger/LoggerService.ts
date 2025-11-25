import { getLogger, type Logger } from "@webiny/logger";
import { LoggerService as Abstraction } from "./abstractions.js";

export class LoggerService implements Abstraction.Interface {
    private logger: Logger;

    constructor(logger?: Logger) {
        this.logger = logger || getLogger();
    }

    getLogger(): Logger {
        return this.logger;
    }

    child(bindings: Record<string, any>): Logger {
        return this.logger.child(bindings);
    }

    fatal(msgOrObj: string | object, ...args: any[]): void {
        this.logger.fatal(msgOrObj, ...args);
    }

    error(msgOrObj: string | object, ...args: any[]): void {
        this.logger.error(msgOrObj, ...args);
    }

    warn(msgOrObj: string | object, ...args: any[]): void {
        this.logger.warn(msgOrObj, ...args);
    }

    info(msgOrObj: string | object, ...args: any[]): void {
        this.logger.info(msgOrObj, ...args);
    }

    debug(msgOrObj: string | object, ...args: any[]): void {
        this.logger.debug(msgOrObj, ...args);
    }

    trace(msgOrObj: string | object, ...args: any[]): void {
        this.logger.trace(msgOrObj, ...args);
    }
}
