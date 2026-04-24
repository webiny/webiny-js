import { createAbstraction } from "@webiny/feature/api";

export interface ILogger {
    // Basic logging levels
    trace(objOrMsg: object | string, ...args: any[]): void;
    debug(objOrMsg: object | string, ...args: any[]): void;
    info(objOrMsg: object | string, ...args: any[]): void;
    warn(objOrMsg: object | string, ...args: any[]): void;
    error(objOrMsg: object | string, ...args: any[]): void;
    fatal(objOrMsg: object | string, ...args: any[]): void;

    // Generic log (defaults to 'info')
    log(objOrMsg: object | string, ...args: any[]): void;
}

/** Structured logging with multiple log levels. */
export const Logger = createAbstraction<ILogger>("Logger");

export namespace Logger {
    export type Interface = ILogger;
}
