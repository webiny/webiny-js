import { pino } from "pino";
import type { DestinationStream } from "pino";
import type { Logger } from "./abstractions.js";
import { PinoLogger } from "./PinoLogger.js";

const DEFAULT_LOG_LEVEL = "info";

/**
 * A Logger at the level `WEBINY_API_LOG_LEVEL` sets, writing to `destination`, or to stdout without
 * one. Each event handler builds one at boot with its hosting type's destination: pino-lambda on AWS,
 * plain stdout on a standalone server.
 */
export function createLogger(destination?: DestinationStream): Logger.Interface {
    const level = process.env.WEBINY_API_LOG_LEVEL || DEFAULT_LOG_LEVEL;
    if (destination) {
        const pinoLogger = pino({ level }, destination);
        return new PinoLogger(pinoLogger);
    }
    const pinoLogger = pino({ level });
    return new PinoLogger(pinoLogger);
}
