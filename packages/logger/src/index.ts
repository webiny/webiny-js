import type { DestinationStream, LevelWithSilent, Logger, LoggerOptions } from "pino";
import { pino } from "pino";

export {
    pino,
    levels,
    version,
    stdSerializers,
    symbols,
    stdTimeFunctions,
    multistream,
    destination,
    transport
} from "pino";
export type {
    DestinationStream,
    Logger,
    LogFn,
    WriteFn,
    BaseLogger,
    TransportTargetOptions,
    TransportSingleOptions,
    TransportPipelineOptions,
    TransportMultiOptions,
    TransportBaseOptions,
    TimeFn,
    ThreadStream,
    StreamEntry,
    SerializerFn,
    SerializedResponse,
    SerializedRequest,
    SerializedError,
    Bindings,
    ChildLoggerOptions,
    CustomLevelLogger,
    LoggerOptions,
    DestinationStreamHasMetadata,
    DestinationStreamWithMetadata,
    Level,
    LevelChangeEventListener,
    LevelMapping,
    LevelOrString,
    LevelWithSilent,
    redactOptions,
    PlaceholderTypeMapping,
    PlaceholderSpecifier,
    ParseLogFnArgs,
    OnChildCallback,
    MultiStreamRes,
    MultiStreamOptions,
    MixinMergeStrategyFn,
    MixinFn,
    LoggerExtras,
    LogEvent,
    LogDescriptor,
    LevelWithSilentOrString
} from "pino";

export interface RedactOptions {
    paths: string[];
    censor?: string | ((value: any, path: string[]) => any);
    remove?: boolean;
}

// export interface LoggerOptions extends Omit<BaseLoggerOptions, "redact"> {
//     redact?: string[] | RedactOptions;
// }

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

export const createPinoLogger = (input?: LoggerOptions, stream?: DestinationStream): Logger => {
    const options = {
        ...(input || {}),
        level: getLogLevel(input?.level)
    };
    if (!stream) {
        return pino(options);
    }
    return pino(options, stream);
};

export const configureLogger = (options: LoggerOptions, stream?: DestinationStream): void => {
    logger = createPinoLogger(options, stream);
};

export const getLogger = () => {
    if (!logger) {
        logger = createPinoLogger();
    }
    return logger;
};
