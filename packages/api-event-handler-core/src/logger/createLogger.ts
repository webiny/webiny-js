import { pino } from "pino";
import type { DestinationStream } from "pino";
import type { LoggerOptions } from "pino";
import type { Logger } from "@webiny/api-core/features/logger/index.js";
import { PinoLogger } from "./PinoLogger.js";

const DEFAULT_LOG_LEVEL = "info";

/*
 * pino's serializer marks each error it visits to detect cycles, which throws on a frozen error.
 * Logging must never throw, so that case falls back to the fields a reader needs.
 */
function serializeError(error: Error) {
    try {
        return pino.stdSerializers.err(error);
    } catch {
        return {
            type: error.name,
            message: error.message,
            stack: error.stack
        };
    }
}

/**
 * A Logger at the level `WEBINY_API_LOG_LEVEL` sets, writing to `destination`, or to stdout without
 * one. Each event handler builds one at boot with its hosting type's destination: pino-lambda on AWS,
 * plain stdout on a standalone server.
 *
 * `lineContext` returns fields every line carries, such as the id of the request that wrote it. It
 * runs when the line is logged, in the caller's async context, so it can read which request is
 * running. Its fields win over a log call's own fields of the same name: a line can't claim to
 * belong to another request.
 */
export function createLogger(
    destination?: DestinationStream,
    lineContext?: () => object
): Logger.Interface {
    const options: LoggerOptions = {
        level: process.env.WEBINY_API_LOG_LEVEL || DEFAULT_LOG_LEVEL,
        mixin: lineContext,
        // pino's default lets the log call's fields win, and writes them into the mixin's object.
        mixinMergeStrategy: (mergeObject, mixinObject) => {
            return { ...mergeObject, ...mixinObject };
        },
        /*
         * pino only serializes an Error under `err`. Backend code logs `{ error }`, which without
         * this prints `{}`, with no message or stack.
         */
        serializers: {
            error: serializeError
        }
    };
    if (destination) {
        const pinoLogger = pino(options, destination);
        return new PinoLogger(pinoLogger);
    }
    const pinoLogger = pino(options);
    return new PinoLogger(pinoLogger);
}
