import type { Container } from "@webiny/di";
import { Logger } from "@webiny/api-core/features/logger/index.js";

export interface LoggedError {
    message: string;
    fields: Record<string, unknown>;
}

/** Errors logged through `Logger`, captured by `captureLoggedErrors`. Clear it in `beforeEach`. */
export const loggedErrors: LoggedError[] = [];

class CapturingLogger implements Logger.Interface {
    public constructor(private decoratee: Logger.Interface) {}

    public trace(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.trace(objOrMsg, ...args);
    }
    public debug(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.debug(objOrMsg, ...args);
    }
    public info(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.info(objOrMsg, ...args);
    }
    public warn(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.warn(objOrMsg, ...args);
    }
    public error(objOrMsg: object | string, ...args: any[]): void {
        if (typeof objOrMsg === "string") {
            loggedErrors.push({ message: objOrMsg, fields: {} });
            return;
        }
        loggedErrors.push({ message: String(args[0]), fields: { ...objOrMsg } });
    }
    public fatal(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.fatal(objOrMsg, ...args);
    }
    public log(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.log(objOrMsg, ...args);
    }
}

/** Captures logged errors into `loggedErrors` instead of printing them (`legacyPlugins`). */
export const captureLoggedErrors = (container: Container) => {
    container.registerDecorator(
        Logger.createDecorator({ decorator: CapturingLogger, dependencies: [] })
    );
};
