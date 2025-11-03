import { createImplementation } from "@webiny/di";
import { createPinoLogger as baseCreatePinoLogger, type Logger } from "@webiny/logger";
import { LoggerService } from "~/abstractions/index.js";
import * as fs from "node:fs";
import path from "node:path";
import findUp from "find-up";

const DEFAULT_LOG_LEVEL = "info";

export class DefaultLoggerService implements LoggerService.Interface {
    pinoLogger: Logger;

    constructor() {
        const logStream = this.getLogStream();

        const level = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;
        this.pinoLogger = baseCreatePinoLogger({ level }, logStream);
    }

    trace(message?: any, ...optionalParams: any[]) {
        this.pinoLogger.trace(message, ...optionalParams);
    }

    fatal(message?: any, ...optionalParams: any[]) {
        this.pinoLogger.fatal(message, ...optionalParams);
    }

    debug(message?: any, ...optionalParams: any[]) {
        this.pinoLogger.debug(message, ...optionalParams);
    }

    info(message?: any, ...optionalParams: any[]) {
        this.pinoLogger.info(message, ...optionalParams);
    }

    warn(message?: any, ...optionalParams: any[]) {
        this.pinoLogger.warn(message, ...optionalParams);
    }

    error(message?: any, ...optionalParams: any[]) {
        this.pinoLogger.error(message, ...optionalParams);
    }

    log(message?: any, ...optionalParams: any[]) {
        this.pinoLogger.info(message, ...optionalParams);
    }

    private getLogStream() {
        // Wanted to use `GetProjectSdkService` to get project root path, but
        // to get that, had to call async method, which is not allowed in constructor.
        // TODO: implement a better way to get project root path.
        const webinyConfigPath = findUp.sync("webiny.config.tsx");
        if (!webinyConfigPath) {
            // Should not happen, but just in case.
            throw new Error("Could not find project root path.");
        }

        const projectRootPath = path.dirname(webinyConfigPath!);

        const logsFolderPath = path.join(projectRootPath, ".webiny", "logs");
        const logsFileName = this.getLogFileName();

        if (!fs.existsSync(logsFolderPath)) {
            fs.mkdirSync(logsFolderPath, { recursive: true });
        }

        const logFilePath = path.join(logsFolderPath, logsFileName);

        // Ensure the file exists or can be appended to
        return fs.createWriteStream(logFilePath, { flags: "a" });
    }

    private getLogFileName() {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        return `logs-${dateStr}.log`;
    }
}

export const loggerService = createImplementation({
    abstraction: LoggerService,
    implementation: DefaultLoggerService,
    dependencies: []
});
