import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { LoggerService as LoggerServiceAbstraction } from "./abstractions.js";
import { LoggerService } from "./LoggerService.js";
import type { Logger } from "@webiny/logger";

export const LoggerServiceFeature = createFeature({
    name: "LoggerService",
    register(container: Container, logger?: Logger) {
        container.registerInstance(LoggerServiceAbstraction, new LoggerService(logger));
    }
});
