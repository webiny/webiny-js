import { pino } from "pino";
import type { DestinationStream } from "pino";
import type { LoggerOptions } from "pino";
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
 * A logger at the level `WEBINY_API_LOG_LEVEL` sets, writing to `destination`, or to stdout without
 * one. Each event handler builds one at boot with its hosting type's destination: pino-lambda on AWS,
 * plain stdout on a standalone server.
 */
export function createLogger(destination?: DestinationStream): PinoLogger {
    const options: LoggerOptions = {
        level: process.env.WEBINY_API_LOG_LEVEL || DEFAULT_LOG_LEVEL,
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
