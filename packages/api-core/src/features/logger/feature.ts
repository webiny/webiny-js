import { createFeature } from "@webiny/feature/api";
import { LoggerService } from "./LoggerService.js";

export const LoggerFeature = createFeature({
    name: "LoggerFeature",
    register(container) {
        container.register(LoggerService);
    }
});
