import { createImplementation } from "@webiny/di";
import { LoggerService } from "~/abstractions/index.js";
import * as fs from "node:fs";
import path from "node:path";
import findUp from "find-up";
import { pino, type Logger } from "pino";
import pinoPretty from "pino-pretty";

const DEFAULT_LOG_LEVEL = "info";

export class DefaultLoggerService implements LoggerService.Interface {
    private pinoLogger: Logger | null = null;

    trace(message?: any, ...optionalParams: any[]) {
        const logger = this.getLogger();
        logger.trace(message, ...optionalParams);
    }

    fatal(message?: any, ...optionalParams: any[]) {
        const logger = this.getLogger();
        logger.fatal(message, ...optionalParams);
    }

    debug(message?: any, ...optionalParams: any[]) {
        const logger = this.getLogger();
        logger.debug(message, ...optionalParams);
    }

    info(message?: any, ...optionalParams: any[]) {
        const logger = this.getLogger();
        logger.info(message, ...optionalParams);
    }

    warn(message?: any, ...optionalParams: any[]) {
        const logger = this.getLogger();
        logger.warn(message, ...optionalParams);
    }

    error(message?: any, ...optionalParams: any[]) {
        const logger = this.getLogger();
        logger.error(message, ...optionalParams);
    }

    log(message?: any, ...optionalParams: any[]) {
        const logger = this.getLogger();
        logger.info(message, ...optionalParams);
    }

    private getLogger() {
        if (this.pinoLogger) {
            return this.pinoLogger;
        }

        const logStream = this.getLogStream();
        const level = process.env.WEBINY_LOG_LEVEL || DEFAULT_LOG_LEVEL;

        this.pinoLogger = pino({ level }, logStream);

        return this.pinoLogger;
    }

    private getLogStream() {
        const debugEnabled = process.argv.includes("--show-logs");
        if (debugEnabled) {
            return pinoPretty({
                ignore: "pid,hostname"
            });
        }

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
