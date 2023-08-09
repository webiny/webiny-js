import { LevelWithSilent, Logger, LoggerOptions as BaseLoggerOptions, pino } from "pino";
import pinoPretty from "pino-pretty";

export * from "pino";

export interface RedactOptions {
    paths: string[];
    censor?: string | ((value: any, path: string[]) => any);
    remove?: boolean;
}

export interface LoggerOptions extends Omit<BaseLoggerOptions, "redact"> {
    redact?: string[] | RedactOptions;
}

const levels: LevelWithSilent[] = ["fatal", "error", "warn", "info", "debug", "trace", "silent"];
/**
 * Gets the log level from the input or the LOG_LEVEL environment variable.
 */
export const getLogLevel = (input?: string, defaultLevel: LevelWithSilent = "info"): string => {
    input = input || process.env.LOG_LEVEL;
    if (!input || input.length === 0) {
        return defaultLevel;
    }
    return levels.includes(input as LevelWithSilent) ? input : defaultLevel;
};

let logger: Logger;

export const createPinoLogger = (options: LoggerOptions = {}) => {
    return pino(
        {
            level: getLogLevel(options?.level),
            ...(options || {})
        },
        pinoPretty({
            ignore: "pid,hostname"
        })
    );
};

export const configureLogger = (options: LoggerOptions): void => {
    logger = createPinoLogger(options);
};

export const getLogger = () => {
    if (!logger) {
        logger = createPinoLogger();
    }
    return logger;
};
