import { createImplementation } from "@webiny/feature/api";
import { type Logger as PinoLogger, pino } from "pino";
import { Logger as LoggerAbstraction } from "./abstractions.js";

// TODO: We have `pino-lambda` hardcoded here simply b/c of lack of good infrastructure.
//       We want `pino-lambda` for AWS Lambda, but its setup step relies on context of the Lambda function. That's
//       why we also have it hardcoded in `createHandler` function in `handler-aws` package.
//       Once we have a better infrastructure for handling such cases, we should refactor this.
import { pinoLambdaDestination, StructuredLogFormatter } from "pino-lambda";

const DEFAULT_LOG_LEVEL = "info";

export class LoggerImpl implements LoggerAbstraction.Interface {
    private pinoLogger: PinoLogger;

    constructor() {
        const level = this.getLogLevel();
        const destination = pinoLambdaDestination({
            formatter: new StructuredLogFormatter()
        });
        this.pinoLogger = pino({ level }, destination);
    }

    trace(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.trace(objOrMsg, ...args);
    }

    debug(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.debug(objOrMsg, ...args);
    }

    info(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.info(objOrMsg, ...args);
    }

    warn(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.warn(objOrMsg, ...args);
    }

    error(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.error(objOrMsg, ...args);
    }

    fatal(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.fatal(objOrMsg, ...args);
    }

    log(objOrMsg: object | string, ...args: any[]) {
        this.pinoLogger.info(objOrMsg, ...args);
    }

    private getLogLevel() {
        return process.env.WEBINY_LOG_LEVEL || DEFAULT_LOG_LEVEL;
    }
}

export const Logger = createImplementation({
    abstraction: LoggerAbstraction,
    implementation: LoggerImpl,
    dependencies: []
});
