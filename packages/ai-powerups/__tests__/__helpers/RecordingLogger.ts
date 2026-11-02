import type { Container } from "@webiny/di";
import { Logger } from "@webiny/api-core/features/logger/index.js";

export interface RecordedLog {
    level: "info" | "error";
    message: string;
    fields: Record<string, unknown>;
}

/** A `Logger` that records `info` and `error`; the other levels are dropped. */
export class RecordingLogger implements Logger.Interface {
    public readonly logs: RecordedLog[] = [];

    public get errors(): RecordedLog[] {
        return this.logs.filter(log => log.level === "error");
    }

    public get infos(): RecordedLog[] {
        return this.logs.filter(log => log.level === "info");
    }

    public trace(): void {}
    public debug(): void {}
    public warn(): void {}
    public fatal(): void {}
    public log(): void {}

    public info(objOrMsg: object | string, ...args: any[]): void {
        this.logs.push({
            level: "info",
            message: typeof objOrMsg === "string" ? objOrMsg : String(args[0]),
            fields: typeof objOrMsg === "string" ? {} : { ...objOrMsg }
        });
    }

    public error(objOrMsg: object | string, ...args: any[]): void {
        this.logs.push({
            level: "error",
            message: typeof objOrMsg === "string" ? objOrMsg : String(args[0]),
            fields: typeof objOrMsg === "string" ? {} : { ...objOrMsg }
        });
    }
}

/** Registers a new `RecordingLogger` as the `Logger` and returns it, so a test can read the logs. */
export const registerRecordingLogger = (container: Container): RecordingLogger => {
    const logger = new RecordingLogger();
    container.registerInstance(Logger, logger);
    return logger;
};
