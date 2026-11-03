import { createFeature } from "@webiny/feature/api";
import { Logger } from "./abstractions.js";
import { createLogger } from "./createLogger.js";

export const LoggerFeature = createFeature({
    name: "LoggerFeature",
    register(container) {
        /*
         * The default, for containers that no event handler built, such as tests. Each event handler
         * registers its own Logger at root, and puts that one back over this default per request.
         * A factory, so a request that never logs builds no pino instance.
         */
        container.registerFactory(Logger, () => {
            return createLogger();
        });
    }
});
