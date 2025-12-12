import { createAbstraction } from "@webiny/feature/api";

/**
 * Logger Service Interface
 */
export interface ILoggerService {
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

export const LoggerService = createAbstraction<ILoggerService>("LoggerService");

export namespace LoggerService {
    export type Interface = ILoggerService;
}

