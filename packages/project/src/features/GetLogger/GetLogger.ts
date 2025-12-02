import { createImplementation } from "@webiny/di";
import { GetLogger, LoggerService } from "~/abstractions/index.js";

export class DefaultGetLogger implements GetLogger.Interface {
    constructor(private loggerService: LoggerService.Interface) {}

    execute() {
        return this.loggerService;
    }
}

export const getLogger = createImplementation({
    abstraction: GetLogger,
    implementation: DefaultGetLogger,
    dependencies: [LoggerService]
});
