import { createFeature } from "@webiny/feature/api";
import { Logger } from "./LoggerService.js";

export const LoggerFeature = createFeature({
    name: "LoggerFeature",
    register(container) {
        container.register(Logger);
    }
});
