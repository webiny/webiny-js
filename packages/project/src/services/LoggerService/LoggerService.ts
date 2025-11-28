import { createImplementation } from "@webiny/di";
import { GetProjectService, LoggerService } from "~/abstractions/index.js";
import * as fs from "node:fs";
import path from "node:path";
import { type Logger, pino } from "pino";
import pinoPretty from "pino-pretty";

const DEFAULT_LOG_LEVEL = "info";

export class DefaultLoggerService implements LoggerService.Interface {
    pinoLogger: Logger | null = null;

    constructor(private getProjectService: GetProjectService.Interface) {}

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

        const level = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;
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

        const project = this.getProjectService.execute();

        const logsFolderPath = project.paths.dotWebinyFolder.join("logs").toString();
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
    dependencies: [GetProjectService]
});
